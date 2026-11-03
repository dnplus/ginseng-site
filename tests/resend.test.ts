import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pushSubscriber, resendReady, segmentFor, type ContactsClient } from '../lib/resend-sync.ts';
import { absolutize, absolutizeMarkdown, issueEmail, RESEND_UNSUBSCRIBE } from '../lib/newsletter-template.ts';
import { parsePost } from '../lib/blog.ts';

const env = {RESEND_API_KEY: 're_test', RESEND_SEGMENT_ZH_TW: 'seg-zh', RESEND_SEGMENT_EN: 'seg-en'};
type Call = [string, unknown];
function fake(responses: Partial<Record<'create' | 'update' | 'add' | 'remove', {message: string; name?: string; statusCode?: number} | null>> = {}) {
  const calls: Call[] = [];
  const reply = (kind: 'create' | 'update' | 'add' | 'remove', options: unknown) => { calls.push([kind, options]); return Promise.resolve({error: responses[kind] ?? null}); };
  const client: ContactsClient = {contacts: {create: options => reply('create', options), update: options => reply('update', options), segments: {add: options => reply('add', options), remove: options => reply('remove', options)}}};
  return {client, calls};
}

test('Resend is used only when the key and both language segments are set', () => {
  assert.equal(resendReady(env), true);
  assert.equal(resendReady({...env, RESEND_SEGMENT_EN: ''}), false);
  assert.equal(segmentFor(env, 'en'), 'seg-en');
  assert.equal(segmentFor(env, 'zh-TW'), 'seg-zh');
});

test('a confirmed subscriber becomes a subscribed contact in its language segment', async () => {
  const {client, calls} = fake();
  await pushSubscriber(client, env, {email: 'a@example.test', status: 'active', locale: 'en'});
  assert.deepEqual(calls, [['create', {email: 'a@example.test', unsubscribed: false, segments: [{id: 'seg-en'}]}], ['remove', {email: 'a@example.test', segmentId: 'seg-zh'}]]);
});

test('an existing contact is resubscribed, added to its segment and taken out of the other language', async () => {
  const {client, calls} = fake({create: {message: 'exists', statusCode: 409}, add: {message: 'already in segment', statusCode: 422}, remove: {message: 'not in segment', statusCode: 404}});
  await pushSubscriber(client, env, {email: 'a@example.test', status: 'active', locale: 'zh-TW'});
  assert.deepEqual(calls.map(([kind]) => kind), ['create', 'update', 'add', 'remove']);
  assert.deepEqual(calls[3][1], {email: 'a@example.test', segmentId: 'seg-en'});
  assert.deepEqual(calls[1][1], {email: 'a@example.test', unsubscribed: false});
  assert.deepEqual(calls[2][1], {email: 'a@example.test', segmentId: 'seg-zh'});
});

test('an unsubscribe is mirrored, and a contact Resend never had is fine', async () => {
  const {client, calls} = fake({update: {message: 'Contact not found', name: 'not_found', statusCode: 404}});
  await pushSubscriber(client, env, {email: 'a@example.test', status: 'unsubscribed', locale: 'zh-TW'});
  assert.deepEqual(calls, [['update', {email: 'a@example.test', unsubscribed: true}]]);
  await assert.rejects(pushSubscriber(fake({update: {message: 'boom', statusCode: 500}}).client, env, {email: 'a@example.test', status: 'unsubscribed', locale: 'en'}), /boom/);
});

test('issue emails use absolute links, a web version and the Resend unsubscribe link', () => {
  assert.equal(absolutize('<a href="/blog/x">x</a><img src="/blog/x/01.png"><a href="//cdn.test/y">y</a>', 'https://site.test'), '<a href="https://site.test/blog/x">x</a><img src="https://site.test/blog/x/01.png"><a href="//cdn.test/y">y</a>');
  const issue = parsePost('/content/newsletters/en/2026-11.md', '---\ntitle: November\ndate: 2026-11-15\nsummary: What is new\n---\nHello');
  const email = issueEmail(issue, '<p>Hello <a href="/en/blog">blog</a></p>', 'https://site.test');
  assert.equal(email.subject, 'November');
  assert.equal(email.previewText, 'What is new');
  assert.ok(email.html.includes('href="https://site.test/en/blog"'));
  assert.ok(email.html.includes('https://site.test/en/newsletter/2026-11'));
  assert.ok(email.html.includes(RESEND_UNSUBSCRIBE) && email.text.includes(RESEND_UNSUBSCRIBE));
});

test('the plain-text part resolves site-relative Markdown links too', () => {
  assert.equal(absolutizeMarkdown('[Read](/en/blog/x) ![img](/blog/x/en-01.png) [ext](https://a.test) [cdn](//cdn.test)', 'https://site.test'),
    '[Read](https://site.test/en/blog/x) ![img](https://site.test/blog/x/en-01.png) [ext](https://a.test) [cdn](//cdn.test)');
  const issue = parsePost('/content/newsletters/en/2026-12.md', '---\ntitle: December\ndate: 2026-12-01\n---\nSee [the post](/en/blog/x)');
  assert.ok(issueEmail(issue, '<p>x</p>', 'https://site.test').text.includes('(https://site.test/en/blog/x)'));
});

test('email content gets the cafe styles: sticker headings, styled links, quotes and video cards', async () => {
  const {styleContent} = await import('../lib/email-layout.ts');
  const html = styleContent('<h2>本期影片</h2><p><a href="https://www.youtube.com/watch?v=tbj0Azzlguw">EP087</a></p><p>See <a href="/blog/ep087">the post</a> and <img src="/blog/ep087/zh-TW-01.png" alt=""></p><blockquote>\n<p>quote</p>\n</blockquote>', 'https://site.test', 'zh-TW');
  assert.match(html, /<h2 style="[^"]*"><span style="[^"]*background:#9fd49a[^"]*">本期影片<\/span><\/h2>/);
  assert.ok(html.includes('https://i.ytimg.com/vi/tbj0Azzlguw/hqdefault.jpg') && html.includes('>EP087</p>') && html.includes('看這集影片'), 'A lone YouTube link becomes a video card with its caption.');
  assert.ok(html.includes('href="https://site.test/blog/ep087"') && html.includes('src="https://site.test/blog/ep087/zh-TW-01.png"'), 'Site-relative links and images become absolute.');
  assert.equal((html.match(/\sstyle="/g) ?? []).length, (html.match(/<(?:a|img|p|h2|span|blockquote|table|td)\b/g) ?? []).length, 'Every styled element carries exactly one style attribute.');
  assert.match(html, /<p style="margin:0;[^"]*">quote<\/p>\s*<\/blockquote>/, 'The last paragraph in a quote has no bottom gap.');
});

test('a bare YouTube URL becomes a card without a caption; other lone links stay links', async () => {
  const {styleContent} = await import('../lib/email-layout.ts');
  const bare = styleContent('<p><a href="https://youtu.be/tbj0Azzlguw">https://youtu.be/tbj0Azzlguw</a></p>', 'https://site.test', 'en');
  assert.ok(bare.includes('hqdefault.jpg') && bare.includes('Watch the video') && !bare.includes('>https://youtu.be/tbj0Azzlguw</p>'));
  const plain = styleContent('<p><a href="https://example.test/">Example</a></p>', 'https://site.test', 'en');
  assert.ok(!plain.includes('hqdefault') && plain.includes('>Example</a>'));
});

test('issue and confirmation emails share the branded shell', async () => {
  const {confirmationEmail} = await import('../lib/newsletter-email.ts');
  const confirm = confirmationEmail('https://site.test', 'en', 'a@example.test', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222');
  for (const html of [confirm.html, issueEmail(parsePost('/content/newsletters/en/x.md', '---\ntitle: X\ndate: 2026-11-01\nsummary: Preview line\n---\nHi'), '<p>Hi</p>', 'https://site.test').html]) {
    assert.ok(html.startsWith('<!doctype html>') && html.includes('https://site.test/assets/email/ginseng-avatar.png') && html.includes('TRY CATCH'));
    assert.ok(html.includes('https://x.com/ginsengtrycatch') && html.includes('https://pacafe.dnplus.dev'), 'Footer links the socials and products.');
    assert.ok(html.includes('prefers-color-scheme:dark'), 'Dark mode styles are included.');
  }
  assert.ok(confirm.html.includes('https://site.test/en/newsletter/confirm?token=11111111-1111-4111-8111-111111111111'));
});
