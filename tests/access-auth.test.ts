import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTPayload } from 'jose';
import { isStudioOwner, type StudioAccessConfig } from '../lib/access-auth.ts';

const issuer = 'https://ginseng-fixture.cloudflareaccess.com';
const audience = 'ginseng-studio-fixture';
const ownerEmail = 'owner@example.test';
const config: StudioAccessConfig = {
  CF_ACCESS_TEAM_DOMAIN: issuer,
  CF_ACCESS_AUD: audience,
  STUDIO_OWNER_EMAIL: ownerEmail,
};
const keys = await generateKeyPair('RS256');
const publicJwk = await exportJWK(keys.publicKey);
const keySet = createLocalJWKSet({ keys: [{ ...publicJwk, kid: 'fixture', alg: 'RS256', use: 'sig' }] });

async function signedToken(overrides: JWTPayload = {}) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    iss: issuer, aud: audience, sub: 'fixture-owner', email: ownerEmail,
    iat: now, exp: now + 300, ...overrides,
  }).setProtectedHeader({ alg: 'RS256', kid: 'fixture' }).sign(keys.privateKey);
}

function tokenHeaders(token: string) {
  return new Headers({ 'cf-access-jwt-assertion': token });
}

test('a signed Access JWT authorizes only the configured owner', async () => {
  assert.equal(await isStudioOwner(tokenHeaders(await signedToken()), config, keySet), true);
  assert.equal(await isStudioOwner(tokenHeaders(await signedToken({ email: 'OWNER@EXAMPLE.TEST' })), {
    CF_ACCESS_TEAM_DOMAIN: ` ${issuer}/ `,
    CF_ACCESS_AUD: ` ${audience} `,
    STUDIO_OWNER_EMAIL: ` ${ownerEmail} `,
  }, keySet), true);
  assert.equal(await isStudioOwner(tokenHeaders(await signedToken({ email: 'visitor@example.test' })), config, keySet), false);
});

test('JWT verification rejects the wrong Access team, application, or expiration', async () => {
  for (const claims of [
    { iss: 'https://another-team.cloudflareaccess.com' },
    { aud: 'another-application' },
    { exp: Math.floor(Date.now() / 1000) - 60 },
  ]) {
    assert.equal(await isStudioOwner(tokenHeaders(await signedToken(claims)), config, keySet), false);
  }
});

test('forged signatures and unsupported algorithms cannot authorize an owner', async () => {
  const attackerKeys = await generateKeyPair('RS256');
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: issuer, aud: audience, sub: 'fixture-owner', email: ownerEmail, iat: now, exp: now + 300 };
  const forged = await new SignJWT(claims).setProtectedHeader({ alg: 'RS256', kid: 'fixture' }).sign(attackerKeys.privateKey);
  assert.equal(await isStudioOwner(tokenHeaders(forged), config, keySet), false);
  const symmetric = await new SignJWT(claims).setProtectedHeader({ alg: 'HS256', kid: 'fixture' }).sign(new Uint8Array(32).fill(1));
  assert.equal(await isStudioOwner(tokenHeaders(symmetric), config, keySet), false);
  assert.equal(await isStudioOwner(tokenHeaders('malformed.jwt.value'), config, keySet), false);
});

test('tokens must include expiration, issue time, subject, and an email claim', async () => {
  for (const claim of ['exp', 'iat', 'sub', 'email']) {
    assert.equal(await isStudioOwner(tokenHeaders(await signedToken({ [claim]: undefined })), config, keySet), false, `missing ${claim}`);
  }
  assert.equal(await isStudioOwner(tokenHeaders(await signedToken({ email: 42 })), config, keySet), false);
});

test('missing configuration and unsafe team domain URLs fail closed', async () => {
  const headers = tokenHeaders(await signedToken());
  for (const field of ['CF_ACCESS_TEAM_DOMAIN', 'CF_ACCESS_AUD', 'STUDIO_OWNER_EMAIL']) {
    assert.equal(await isStudioOwner(headers, { ...config, [field]: undefined }, keySet), false, `missing ${field}`);
    assert.equal(await isStudioOwner(headers, { ...config, [field]: ' ' }, keySet), false, `blank ${field}`);
  }
  for (const domain of [
    'http://ginseng-fixture.cloudflareaccess.com',
    'https://example.test',
    'https://ginseng-fixture.cloudflareaccess.com.evil.test',
    `${issuer}/path`, `${issuer}?query=1`, `${issuer}#fragment`,
    'https://user:password@ginseng-fixture.cloudflareaccess.com',
    'https://ginseng-fixture.cloudflareaccess.com:8443',
  ]) {
    assert.equal(await isStudioOwner(headers, { ...config, CF_ACCESS_TEAM_DOMAIN: domain }, keySet), false, domain);
  }
});

test('ChatGPT and spoofed email headers grant no authority', async () => {
  assert.equal(await isStudioOwner(new Headers(), config, keySet), false);
  const spoof = new Headers({
    'oai-authenticated-user-id': 'fixture-owner',
    'oai-authenticated-user-email': ownerEmail,
    'cf-access-authenticated-user-email': ownerEmail,
  });
  assert.equal(await isStudioOwner(spoof, config, keySet), false);
  spoof.set('cf-access-jwt-assertion', await signedToken({ email: 'visitor@example.test' }));
  assert.equal(await isStudioOwner(spoof, config, keySet), false);
});
