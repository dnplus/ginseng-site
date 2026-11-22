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
const cappedEmail = `capped-${fixture}@example.test`, staleEmail = `stale-${fixture}@example.test`, keptEmail = `kept-${fixture}@example.test`;
const fixtureIp = `2001:db8:${fixture.slice(0, 4)}:${fixture.slice(9, 13)}::1`;
// A second connection, so the per-address checks do not use up the first one's hourly limit.
const cappedIp = `2001:db8:cafe:${fixture.slice(19, 23)}::1`;
// Mirrors lib/rate-limit.ts for these fixture addresses: the limit counts an IPv6 /64, not a single address.
const rateSubject = ip => `${ip.split('::')[0].split(':').map(group => parseInt(group, 16).toString(16)).join(':')}::/64`;
const rateKeys = new Set();
const sqlString = value => `'${value.replaceAll("'", "''")}'`;
const fixtureEmails = [email, rejectedEmail, cappedEmail, staleEmail, keptEmail].map(sqlString).join(',');

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

function rememberRateKeys(action, ip = fixtureIp) {
  const bucket = Math.floor(Date.now() / 3600000);
  // Include adjacent buckets in case a request crosses an hour boundary.
  for (const candidate of [bucket - 1, bucket, bucket + 1]) {
    rateKeys.add(createHash('sha256').update(`${action}:${rateSubject(ip)}:${candidate}`).digest('hex'));
  }
}

async function post(action, data, expected = 200, extraHeaders = {}) {
  const ip = extraHeaders['CF-Connecting-IP'] ?? fixtureIp;
  rememberRateKeys(action, ip);
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
  rememberRateKeys(action, ip);
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
  assert.ok(html.includes('application/ld+json') && html.includes('"@type":"WebSite"'), 'Home emits WebSite JSON-LD.');
  assert.ok(html.includes('商業合作表單') && html.includes('電子報訂閱'), 'Home includes both interactive forms.');
  assert.ok(!/(?:src|href)="\/(?:@vite\/|@id\/)/.test(html), 'Run this smoke test against the built Worker, not the Vite development server.');
  await page('/privacy', '你的資料，只用在說好的地方。');
  const english = await page('/en', "Hi, I'm Ginseng.");
  assert.ok(english.includes('<html lang="en"') && english.includes('Collaboration form') && english.includes('Newsletter signup'), 'English home renders in English with both forms.');
  const subscribe = 'https://www.youtube.com/@GinsengTryCatch?sub_confirmation=1';
  const anchors = source => [...source.matchAll(/<a\b[^>]*>/g)].map(([tag]) => tag);
  const hasClass = (tag, name) => new RegExp(`class="(?:[^"]* )?${name}(?: [^"]*)?"`).test(tag);
  const href = tag => tag?.match(/href="([^"]*)"/)?.[1]?.replaceAll('&amp;', '&');
  const firstPrimary = source => anchors(source).find(tag => hasClass(tag, 'button') && hasClass(tag, 'primary'));
  assert.equal(href(firstPrimary(html)), subscribe, 'The Chinese hero button subscribes on YouTube.');
  assert.equal(href(firstPrimary(english)), 'https://pacafe.dnplus.dev', 'The English hero button stays PA Cafe.');
  for (const [path, source] of [['/', html], ['/en', english]]) {
    const cta = anchors(source).filter(tag => hasClass(tag, 'nav-cta'));
    assert.equal(cta.length, 1, `${path} has one header subscribe button`);
    assert.equal(href(cta[0]), subscribe, `${path} header button subscribes on YouTube`);
    assert.match(cta[0], /target="_blank"/, `${path} header button opens a new tab`);
  }
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
  const blog = await page('/blog', '影片之外，寫下來的部分。');
  const cardImages = [...blog.matchAll(/<img\b[^>]*src="https:\/\/i\.ytimg\.com\/[^"]+"[^>]*>/g)].map(match => match[0]);
  assert.ok(cardImages.length > 0, 'The blog has video cards to check.');
  assert.ok(cardImages.every(image => /loading="lazy"/.test(image) && !/fetchPriority="high"/i.test(image)), 'List thumbnails remain lazy and do not compete at high priority.');
  const articleResponse = await fetch(`${origin}/blog/ep091`);
  assert.equal(articleResponse.status, 200, 'The article responds successfully.');
  const article = await articleResponse.text();
  const heroUrl = 'https://i.ytimg.com/vi/EvDcTOWc50U/maxresdefault.jpg';
  const hero = [...article.matchAll(/<img\b[^>]*>/g)].map(match => match[0]).filter(image => image.includes(heroUrl));
  assert.equal(hero.length, 1, 'The article renders one video thumbnail.');
  assert.match(hero[0], /fetchPriority="high"/i, 'The article thumbnail is prioritized.');
  assert.match(hero[0], /width="1280" height="720"/, 'The thumbnail keeps its reserved aspect ratio.');
  assert.ok(!/loading="lazy"/.test(hero[0]), 'The article thumbnail is not lazy loaded.');
  const heroPreloads = [...article.matchAll(/<link\b[^>]*>/g)].map(match => match[0]).filter(link => link.includes(heroUrl) && /rel="preload"/.test(link));
  const headerPreloads = (articleResponse.headers.get('link') ?? '').split(',').filter(link => link.includes(heroUrl) && /rel=preload/.test(link));
  assert.equal(heroPreloads.length + headerPreloads.length, 1, 'React emits one preload in the HTML or Link header, without a duplicate manual hint.');
  assert.match([...heroPreloads, ...headerPreloads][0], /fetchPriority="high"/i, 'The SSR preload carries the same high priority.');
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
  const ep093 = await page('/blog/ep093', '共同大腦');
  assert.match(ep093, /property="og:image" content="[^"]*\/blog\/ep093\/cover\.jpg"/, 'Custom cover is used for og:image.');
  assert.ok(ep093.includes('"@type":"BlogPosting"') && ep093.includes('"@type":"BreadcrumbList"'), 'Article emits BlogPosting and BreadcrumbList JSON-LD.');
  assert.ok(ep093.includes('相關文章') && ep093.includes('class="article-related"'), 'Article renders related posts section.');
  const missing = await fetch(`${origin}/blog/no-such-post`);
  assert.equal(missing.status, 404, 'Unknown posts are 404.');
  assert.ok((await missing.text()).includes('NotFoundException'), '404 renders branded not-found page.');
  const robots = await fetch(`${origin}/robots.txt`);
  assert.equal(robots.status, 200, 'robots.txt is served.');
  const robotsText = await robots.text();
  assert.ok(robotsText.includes('Sitemap:') && robotsText.includes('Disallow: /studio'), 'robots.txt advertises sitemap and disallows studio.');
  const homeHead = await fetch(`${origin}/`);
  assert.equal(homeHead.headers.get('x-content-type-options'), 'nosniff', 'HTML responses set X-Content-Type-Options.');
  assert.equal(homeHead.headers.get('x-frame-options'), 'SAMEORIGIN', 'HTML responses set X-Frame-Options.');
  assert.equal(homeHead.headers.get('referrer-policy'), 'strict-origin-when-cross-origin', 'Normal pages set strict-origin-when-cross-origin.');
  const unsubRes = await fetch(`${origin}/unsubscribe`);
  assert.equal(unsubRes.headers.get('referrer-policy'), 'no-referrer', 'Token pages keep no-referrer.');
  assert.ok((await unsubRes.text()).includes('先在這裡，下車也沒關係。'), '/unsubscribe contains expected content');
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

  // Two accepted subscriptions above consumed the first two requests in this bucket. Another address in the same IPv6
  // /64 is the same connection: its requests count toward the same limit.
  const neighbour = { 'CF-Connecting-IP': fixtureIp.replace(/::1$/, '::2:3') };
  for (let request = 3; request <= 12; request++) await post('subscribe', { email, consent: true }, 200, request % 2 ? neighbour : {});
  await post('subscribe', { email, consent: true }, 429, neighbour);
  await post('subscribe', { email, consent: true }, 429);
  const limitKey = createHash('sha256').update(`subscribe:${rateSubject(fixtureIp)}:${Math.floor(Date.now() / 3600000)}`).digest('hex');
  const limits = await d1(`SELECT count FROM rate_limits WHERE key = ${sqlString(limitKey)}`);
  assert.equal(limits.length, 1, 'Rate limit uses the fixture connection key.');
  assert.equal(limits[0].count, 14, 'Every attempt past the twelfth is rate limited, whichever address in the /64 sends it.');
  console.log('PASS per-connection subscription rate limit, shared across an IPv6 /64');

  // Per-address limit on confirmation emails. Each send below is moved out of the 10-minute resend window by hand.
  const fromCapped = { 'CF-Connecting-IP': cappedIp };
  const ago = ms => new Date(Date.now() - ms).toISOString(), day = 24 * 3_600_000;
  const cappedRow = async () => (await d1(`SELECT status, confirm_token, confirm_sends, unsubscribe_token FROM subscribers WHERE email = ${sqlString(cappedEmail)}`))[0];
  const leaveResendWindow = () => d1(`UPDATE subscribers SET confirm_sent_at = ${sqlString(ago(11 * 60_000))} WHERE email = ${sqlString(cappedEmail)}`);
  const unconfirmed = (address, pushedAt) => `(${[randomUUID(), address, 'pending', randomUUID(), 'smoke', ago(40 * day), ago(31 * day), 'zh-TW', 'website', randomUUID(), ago(31 * day), 'done'].map(sqlString).join(', ')}, ${pushedAt ? sqlString(pushedAt) : 'NULL'})`;
  await d1(`INSERT INTO subscribers (id, email, status, unsubscribe_token, consent_version, created_at, updated_at, locale, source, confirm_token, confirm_sent_at, resend_sync, resend_synced_at) VALUES ${unconfirmed(staleEmail, null)}, ${unconfirmed(keptEmail, ago(35 * day))}`);
  await post('subscribe', { email: cappedEmail, consent: true }, 200, fromCapped);
  let latest = await cappedRow();
  assert.equal(latest.confirm_sends, 1, 'The first confirmation email is counted.');
  for (let send = 2; send <= 3; send++) {
    await leaveResendWindow();
    await post('subscribe', { email: cappedEmail, consent: true }, 200, fromCapped);
    const row = await cappedRow();
    assert.notEqual(row.confirm_token, latest.confirm_token, `Confirmation email ${send} goes out once the resend window has passed.`);
    assert.equal(row.confirm_sends, send);
    latest = row;
  }
  await leaveResendWindow();
  await post('subscribe', { email: cappedEmail, consent: true }, 200, fromCapped);
  const capped = await cappedRow();
  assert.equal(capped.confirm_token, latest.confirm_token, 'A fourth confirmation email within a day is not sent.');
  assert.equal(capped.confirm_sends, 3, 'The daily limit holds at three.');
  await post('unsubscribe', { token: capped.unsubscribe_token }, 200, fromCapped);
  await post('subscribe', { email: cappedEmail, consent: true }, 200, fromCapped);
  const stillOut = await cappedRow();
  assert.equal(stillOut.status, 'unsubscribed', 'Unsubscribing does not reopen the limit: the form cannot email the address again that day.');
  assert.equal(stillOut.confirm_token, null);
  await d1(`UPDATE subscribers SET confirm_window_at = ${sqlString(ago(25 * 3_600_000))} WHERE email = ${sqlString(cappedEmail)}`);
  await post('subscribe', { email: cappedEmail, consent: true }, 200, fromCapped);
  const reopened = await cappedRow();
  assert.equal(reopened.status, 'pending', 'After the window the address can ask for a confirmation email again.');
  assert.equal(reopened.confirm_sends, 1, 'The count restarts with the new window.');
  assert.match(reopened.confirm_token, /^[0-9a-f-]{36}$/);
  console.log('PASS per-address limit on confirmation emails');

  const leftover = await d1(`SELECT email FROM subscribers WHERE email IN (${[staleEmail, keptEmail].map(sqlString).join(',')})`);
  assert.deepEqual(leftover.map(row => row.email), [keptEmail], 'A signup that never confirmed is deleted 30 days after its last email; a row that was ever pushed to Resend is kept.');
  console.log('PASS cleanup of signups that never confirmed');

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
