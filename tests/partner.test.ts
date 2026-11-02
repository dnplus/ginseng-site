import assert from 'node:assert/strict';
import { test } from 'node:test';
import { newsletterLocale, partnerSignature, verifyPartner } from '../lib/partner-auth.ts';

const secret = 'test-secret', body = '{"action":"status","email":"a@example.test","source":"pa-cafe"}';
const now = 1_800_000_000_000, timestamp = String(now / 1000);
const headers = (signature: string, at = timestamp) => new Headers({'X-Ginseng-Timestamp': at, 'X-Ginseng-Signature': signature});

test('a request signed with the shared secret is accepted', async () => {
  assert.equal(await verifyPartner(secret, headers(await partnerSignature(secret, timestamp, body)), body, now), true);
});

test('wrong secret, changed body, stale timestamp or missing secret are refused', async () => {
  const signature = await partnerSignature(secret, timestamp, body);
  assert.equal(await verifyPartner('other', headers(signature), body, now), false);
  assert.equal(await verifyPartner(secret, headers(signature), body.replace('status', 'subscribe'), now), false);
  assert.equal(await verifyPartner(secret, headers(signature), body, now + 301_000), false);
  assert.equal(await verifyPartner(undefined, headers(signature), body, now), false);
  assert.equal(await verifyPartner(secret, headers('nothex'), body, now), false);
});

test('product languages map to the two newsletter editions', () => {
  assert.equal(newsletterLocale('zh-TW'), 'zh-TW');
  assert.equal(newsletterLocale('zh-CN'), 'zh-TW');
  for (const language of ['en', 'ja', 'ko', undefined]) assert.equal(newsletterLocale(language), 'en');
});
