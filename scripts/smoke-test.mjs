import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

// This mutates only a local D1 database using synthetic .test records, then removes them.
const input = new URL(process.argv[2] ?? 'http://localhost:5173');
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(input.hostname), 'Smoke tests require a loopback origin.');
assert.ok(['http:', 'https:'].includes(input.protocol), 'Use an HTTP or HTTPS origin.');
assert.equal(input.username + input.password + input.search + input.hash, '', 'Use an origin without credentials, query, or fragment.');
const origin = input.origin;
const cwd = fileURLToPath(new URL('..', import.meta.url));
const run = promisify(execFile);
const fixture = randomUUID();
const email = `smoke-${fixture}@example.test`;
const rejectedEmail = `rejected-${fixture}@example.test`;
const fixtureIp = `2001:db8:${fixture.slice(0, 4)}:${fixture.slice(9, 13)}::1`;
const rateKeys = new Set();
const sqlString = value => `'${value.replaceAll("'", "''")}'`;
const fixtureEmails = [email, rejectedEmail].map(sqlString).join(',');

async function d1(sql) {
  const { stdout } = await run(process.execPath, [
    path.join(cwd, 'node_modules/wrangler/bin/wrangler.js'),
    'd1', 'execute', 'DB', '--local', '--config', 'wrangler.jsonc',
    '--persist-to', '.wrangler/state', '--json', '--command', sql,
  ], {
    cwd,
    env: { ...process.env, WRANGLER_SEND_METRICS: 'false', WRANGLER_WRITE_LOGS: 'false', WRANGLER_LOG_PATH: '.wrangler/logs' },
    maxBuffer: 1024 * 1024,
  });
  const batches = JSON.parse(stdout);
  assert.ok(Array.isArray(batches) && batches.every(batch => batch.success), 'Local D1 execution must succeed.');
  return batches.flatMap(batch => batch.results ?? []);
}

function rememberRateKeys(action) {
  const bucket = Math.floor(Date.now() / 3600000);
  // Include adjacent buckets in case a request crosses an hour boundary.
  for (const candidate of [bucket - 1, bucket, bucket + 1]) {
    rateKeys.add(createHash('sha256').update(`${action}:${fixtureIp}:${candidate}`).digest('hex'));
  }
}

async function post(action, data, expected = 200, extraHeaders = {}) {
  rememberRateKeys(action);
  const response = await fetch(`${origin}/api/${action}`, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': fixtureIp, ...extraHeaders },
    body: JSON.stringify(data),
  });
  assert.equal(response.status, expected, `${action} response status`);
  assert.equal(response.headers.get('cache-control'), 'no-store', `${action} response is not cached`);
  const result = await response.json();
  if (expected === 200) assert.equal(result.ok, true, `${action} acknowledgment`);
  else assert.equal(typeof result.error, 'string', `${action} error message`);
  rememberRateKeys(action);
  return result;
}

async function page(urlPath, text) {
  const response = await fetch(`${origin}${urlPath}`);
  assert.equal(response.status, 200, `${urlPath} page status`);
  assert.ok(response.headers.get('content-type')?.includes('text/html'), `${urlPath} returns HTML`);
  const html = await response.text();
  assert.ok(html.includes(text), `${urlPath} contains expected content`);
  return html;
}

try {
  const html = await page('/', '嗨，我是人蔘。');
  assert.ok(html.includes('商業合作表單') && html.includes('電子報訂閱'), 'Home includes both interactive forms.');
  assert.ok(!/(?:src|href)="\/(?:@vite\/|@id\/)/.test(html), 'Run this smoke test against the built Worker, not the Vite development server.');
  await page('/privacy', '你的資料，只用在說好的地方。');
  const english = await page('/en', "Hi, I'm Ginseng.");
  assert.ok(english.includes('<html lang="en"') && english.includes('Collaboration form') && english.includes('Newsletter signup'), 'English home renders in English with both forms.');
  assert.ok(html.includes('<html lang="zh-Hant-TW"') && /hreflang="en" href="[^"]*\/en"/i.test(html), 'Home declares its language and links the English version.');
  await page('/lab', '做出來，先放這裡。');
  await page('/en/lab', 'Built it? It goes here first.');
  await page('/community', '一起實驗的人，聚在這裡。');
  await page('/en/community', 'Where the tinkerers hang out.');
  const avatar = await fetch(`${origin}/assets/email/ginseng-avatar.png`);
  assert.equal(avatar.status, 200, 'The email header avatar is served (emails load it from the live site).');
  assert.ok(avatar.headers.get('content-type')?.includes('image/png'), 'The email avatar is a PNG, which every mail client shows.');
  const footer = await fetch(`${origin}/brand/footer.js`);
  assert.equal(footer.status, 200, 'The shared brand footer script is served.');
  assert.ok((await footer.text()).includes("customElements.define('ginseng-footer'"), 'The footer script defines <ginseng-footer>.');
  await page('/blog', '影片之外，寫下來的部分。');
  await page('/newsletter', '歷期電子報');
  await page('/en/newsletter', 'Past issues');
  await page('/en/privacy', 'Your data, used only where we said.');
  await page('/en/blog', 'The written-down part.');
  for (const [path, type] of [['/feed.xml', 'application/rss+xml'], ['/en/feed.xml', 'application/rss+xml'], ['/sitemap.xml', 'application/xml']]) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 200, `${path} status`);
    assert.ok(response.headers.get('content-type')?.includes(type), `${path} content type`);
    assert.ok((await response.text()).startsWith('<?xml'), `${path} is XML`);
  }
  // Episodes with an article on the site go there; unknown episodes go to the list.
  for (const [path, target] of [['/ep/082', `${origin}/blog/ep082`], ['/ep/EP079', `${origin}/blog/ep079`], ['/ep/9999', `${origin}/blog`]]) {
    const response = await fetch(`${origin}${path}`, {redirect: 'manual'});
    assert.equal(response.status, 302, `${path} redirects`);
    assert.ok(response.headers.get('location')?.startsWith(target), `${path} redirects to ${target}`);
  }
  await page('/blog/ep087', '一天空轉 288 次');
  assert.equal((await fetch(`${origin}/blog/no-such-post`)).status, 404, 'Unknown posts are 404.');
  await page('/unsubscribe', '先在這裡，下車也沒關係。');
  const assetPaths = [...html.matchAll(/\b(?:src|href)="([^"\s]+\.(?:css|js)(?:\?[^"\s]*)?)"/g)]
    .map(match => new URL(match[1].replaceAll('&amp;', '&'), origin))
    .filter(url => url.origin === origin);
  assert.ok(assetPaths.some(url => url.pathname.endsWith('.css')), 'Built stylesheet is linked.');
  assert.ok(assetPaths.some(url => url.pathname.endsWith('.js')), 'Built client JavaScript is linked.');
  for (const asset of [assetPaths.find(url => url.pathname.endsWith('.css')), assetPaths.find(url => url.pathname.endsWith('.js')), new URL('/assets/ginseng.png', origin)]) {
    const response = await fetch(asset);
    assert.equal(response.status, 200, `asset ${asset.pathname} status`);
    const expectedType = asset.pathname.endsWith('.png') ? 'image/png' : asset.pathname.endsWith('.css') ? 'text/css' : 'javascript';
    assert.ok(response.headers.get('content-type')?.includes(expectedType), `asset ${asset.pathname} content type`);
    assert.ok((await response.arrayBuffer()).byteLength > 0, `asset ${asset.pathname} is nonempty`);
  }
  console.log('PASS built Worker pages, stylesheet, client JavaScript, and portrait');

  for (const kind of ['subscribers', 'inquiries']) {
    const exportPath = `/api/studio/export?kind=${kind}`;
    assert.equal((await fetch(`${origin}${exportPath}`)).status, 403, 'Unauthenticated export is denied.');
    const spoofed = await fetch(`${origin}${exportPath}`, { headers: {
      'oai-authenticated-user-id': 'synthetic-owner',
      'oai-authenticated-user-email': 'owner@example.test',
      'cf-access-authenticated-user-email': 'owner@example.test',
      'cf-access-jwt-assertion': 'forged.jwt.fixture',
    } });
    assert.equal(spoofed.status, 403, 'Forged identity headers cannot export data.');
    assert.ok(!((await spoofed.text()).includes(email)), 'Denied response contains no fixture data.');
  }
  for (const action of ['/api/studio/resend/sync', '/api/studio/resend/broadcast']) {
    const denied = await fetch(`${origin}${action}`, {method: 'POST', headers: {Origin: origin}, body: new URLSearchParams({locale: 'en', slug: 'x'})});
    assert.equal(denied.status, 403, `${action} requires the studio owner`);
  }
  const partner = await fetch(`${origin}/api/partner/newsletter`, {method: 'POST', headers: {'X-Ginseng-Timestamp': String(Math.floor(Date.now() / 1000)), 'X-Ginseng-Signature': '0'.repeat(64)}, body: JSON.stringify({action: 'subscribe', email, source: 'pa-cafe'})});
  assert.equal(partner.status, 403, 'Unsigned partner subscriptions are refused.');
  const webhook = await fetch(`${origin}/api/webhooks/resend`, {method: 'POST', headers: {'svix-id': 'x', 'svix-timestamp': '1', 'svix-signature': 'v1,x'}, body: '{}'});
  assert.equal(webhook.status, 503, 'The Resend webhook refuses everything until its secret is configured.');
  console.log('PASS protected export denies missing and forged identity');

  await post('subscribe', { email, consent: true, website: '' });
  const initial = await d1(`SELECT email, status, unsubscribe_token, consent_version, locale, confirm_token FROM subscribers WHERE email = ${sqlString(email)}`);
  assert.equal(initial.length, 1, 'Subscription persisted exactly once.');
  assert.equal(initial[0].status, 'pending', 'A new subscription waits for email confirmation.');
  assert.equal(initial[0].locale, 'zh-TW');
  assert.match(initial[0].confirm_token, /^[0-9a-f-]{36}$/);
  assert.equal((await d1(`SELECT resend_sync FROM subscribers WHERE email = ${sqlString(email)}`))[0].resend_sync, 'done', 'A brand-new unconfirmed address has nothing to push to Resend.');
  assert.match(initial[0].unsubscribe_token, /^[0-9a-f-]{36}$/);
  assert.ok(initial[0].consent_version, 'Subscription records the consent version.');
  await post('subscribe', { email: email.toUpperCase(), consent: true });
  const duplicate = await d1(`SELECT status, unsubscribe_token FROM subscribers WHERE email = ${sqlString(email)}`);
  assert.equal(duplicate.length, 1, 'Duplicate subscription does not create another row.');
  assert.equal(duplicate[0].unsubscribe_token, initial[0].unsubscribe_token, 'Duplicate subscription preserves the unsubscribe link.');
  assert.equal((await d1(`SELECT confirm_token FROM subscribers WHERE email = ${sqlString(email)}`))[0].confirm_token, initial[0].confirm_token, 'A repeat within the resend window sends no new confirmation.');

  rememberRateKeys('confirm');
  await post('newsletter/confirm', { token: initial[0].confirm_token });
  const confirmed = await d1(`SELECT status, confirm_token, confirmed_at FROM subscribers WHERE email = ${sqlString(email)}`);
  assert.equal(confirmed[0].status, 'active', 'The confirmation link activates the subscription.');
  assert.equal(confirmed[0].confirm_token, null, 'A confirmation link works once.');
  assert.ok(confirmed[0].confirmed_at, 'Confirmation time is recorded.');
  await post('newsletter/confirm', { token: initial[0].confirm_token }, 404);
  await post('newsletter/confirm', { token: 'not-a-token' }, 400);
  rememberRateKeys('confirm');
  await page('/newsletter/confirm?token=x', '確認訂閱人蔘電子報');
  await page('/en/newsletter/confirm?token=x', 'Confirm your subscription');
  assert.equal((await d1(`SELECT resend_sync FROM subscribers WHERE email = ${sqlString(email)}`))[0].resend_sync, 'pending', 'Without Resend configured, the change waits for the studio sync.');
  console.log('PASS double opt-in confirmation');

  const inquiry = {
    name: 'Synthetic Smoke Fixture', email, company: 'Example Test',
    topic: 'AI 導入 / 技術顧問', message: 'Synthetic test inquiry for local migration verification only.',
    consent: true, website: '',
  };
  await post('contact', inquiry);
  const saved = await d1(`SELECT name, email, topic, message, consent_version, notification_status FROM inquiries WHERE email = ${sqlString(email)}`);
  assert.equal(saved.length, 1, 'Contact inquiry persisted exactly once.');
  assert.equal(saved[0].name, inquiry.name);
  assert.equal(saved[0].message, inquiry.message);
  assert.equal(saved[0].notification_status, 'accepted', 'Local email binding accepted the notification.');
  assert.equal(saved[0].consent_version, initial[0].consent_version);
  console.log('PASS subscription, duplicate handling, and contact persistence with D1 readback');

  await post('subscribe', { email: rejectedEmail, consent: false }, 400);
  const englishError = await post('subscribe', { email: 'not-an-email', consent: true }, 400, { 'X-Site-Locale': 'en' });
  assert.equal(englishError.error, 'Please enter a valid email address.', 'English forms get English errors.');
  await post('contact', { ...inquiry, email: rejectedEmail, consent: false }, 400);
  await post('subscribe', { email: rejectedEmail, consent: true }, 403, { Origin: 'https://attacker.example.test' });
  await post('contact', { ...inquiry, email: rejectedEmail, message: 'short' }, 400);
  await post('subscribe', { email: rejectedEmail, consent: true, website: 'bot.example.test' });
  const rejected = await d1(`SELECT COUNT(*) AS count FROM subscribers WHERE email = ${sqlString(rejectedEmail)} UNION ALL SELECT COUNT(*) AS count FROM inquiries WHERE email = ${sqlString(rejectedEmail)}`);
  assert.ok(rejected.every(row => row.count === 0), 'Rejected and honeypot submissions save no records.');
  console.log('PASS consent, origin, content validation, and honeypot checks');

  // Two accepted subscriptions above consumed the first two requests in this bucket.
  for (let request = 3; request <= 12; request++) await post('subscribe', { email, consent: true });
  await post('subscribe', { email, consent: true }, 429);
  const limitKey = createHash('sha256').update(`subscribe:${fixtureIp}:${Math.floor(Date.now() / 3600000)}`).digest('hex');
  const limits = await d1(`SELECT count FROM rate_limits WHERE key = ${sqlString(limitKey)}`);
  assert.equal(limits.length, 1, 'Rate limit uses the fixture connection key.');
  assert.equal(limits[0].count, 13, 'Thirteenth accepted-format attempt is rate limited.');
  console.log('PASS per-connection subscription rate limit');

  await post('unsubscribe', { token: initial[0].unsubscribe_token });
  const unsubscribed = await d1(`SELECT status FROM subscribers WHERE email = ${sqlString(email)}`);
  assert.equal(unsubscribed[0].status, 'unsubscribed', 'Unsubscribe persisted in D1.');
  await post('unsubscribe', { token: randomUUID() }, 404);
  await post('unsubscribe', { token: 'invalid-token' }, 400);
  console.log('PASS unsubscribe persistence and invalid-token handling');

  await d1(`UPDATE subscribers SET status = 'active' WHERE email = ${sqlString(email)}`);
  const oneClick = await fetch(`${origin}/api/unsubscribe/one-click?token=${initial[0].unsubscribe_token}`, {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: 'List-Unsubscribe=One-Click'});
  assert.equal(oneClick.status, 200, 'One-click unsubscribe accepts a provider POST without Origin.');
  assert.equal((await d1(`SELECT status FROM subscribers WHERE email = ${sqlString(email)}`))[0].status, 'unsubscribed', 'One-click unsubscribe persisted.');
  assert.equal((await fetch(`${origin}/api/unsubscribe/one-click?token=${randomUUID()}`, {method: 'POST'})).status, 404);
  const opened = await fetch(`${origin}/api/unsubscribe/one-click?token=${initial[0].unsubscribe_token}`, {redirect: 'manual'});
  assert.equal(opened.status, 303, 'Opening the header link in a browser shows the unsubscribe page.');
  console.log('PASS RFC 8058 one-click unsubscribe');
} finally {
  const deletes = [
    `DELETE FROM subscribers WHERE email IN (${fixtureEmails})`,
    `DELETE FROM inquiries WHERE email IN (${fixtureEmails})`,
  ];
  if (rateKeys.size) deletes.push(`DELETE FROM rate_limits WHERE key IN (${[...rateKeys].map(sqlString).join(',')})`);
  await d1(deletes.join('; '));
  const remaining = await d1(`SELECT COUNT(*) AS count FROM subscribers WHERE email IN (${fixtureEmails}) UNION ALL SELECT COUNT(*) AS count FROM inquiries WHERE email IN (${fixtureEmails})`);
  assert.ok(remaining.every(row => row.count === 0), 'Synthetic fixture rows were removed.');
  if (rateKeys.size) {
    const limits = await d1(`SELECT COUNT(*) AS count FROM rate_limits WHERE key IN (${[...rateKeys].map(sqlString).join(',')})`);
    assert.equal(limits[0].count, 0, 'Only this run’s synthetic rate-limit keys were removed.');
  }
  console.log('PASS synthetic D1 fixture cleanup');
}

console.log(`Migration smoke checks passed at ${origin}`);
