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
  const {client, calls} = fake({create: {message: 'exists', statusCode: 409}, add: {message: 'already', statusCode: 409}, remove: {message: 'not in segment', statusCode: 404}});
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
