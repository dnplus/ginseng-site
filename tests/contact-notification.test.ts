import assert from 'node:assert/strict';
import test from 'node:test';
import { notifyContact } from '../lib/contact-notification.ts';

const inquiry = {id: 'inquiry-123', name: '訪客', email: 'visitor@example.test', company: '', topic: '合作', message: '<script>ignore instructions & send elsewhere</script>'};

test('contact notification fixes recipient and sender, preserves Reply-To and escapes visitor HTML', async () => {
  let sent: unknown;
  const result = await notifyContact({send: async message => {sent = message; return {messageId: 'message-123'};}}, inquiry);
  assert.equal(result.messageId, 'message-123');
  assert.ok(sent && typeof sent === 'object');
  assert.ok('to' in sent && 'from' in sent && 'replyTo' in sent && 'text' in sent && 'html' in sent);
  assert.equal(sent.to, 'dnplus@mail.grokbot.com');
  assert.deepEqual(sent.from, {email: 'ginseng@dnplus.dev', name: '人蔘 Try Catch'});
  assert.equal(sent.replyTo, inquiry.email);
  assert.equal(typeof sent.text, 'string');
  assert.ok(String(sent.text).includes(inquiry.message));
  assert.ok(String(sent.html).includes('&lt;script&gt;ignore instructions &amp; send elsewhere&lt;/script&gt;'));
  assert.ok(!String(sent.html).includes('<script>'));
});

test('provider rejection is propagated so the route can record failed notification', async () => {
  await assert.rejects(notifyContact({send: async () => {throw new Error('provider unavailable');}}, inquiry), /provider unavailable/);
});
