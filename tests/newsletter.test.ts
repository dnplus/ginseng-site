import assert from 'node:assert/strict';
import { test } from 'node:test';
import { confirmationEmail, confirmUrl, listUnsubscribeHeaders } from '../lib/newsletter-email.ts';
import { message, requestLocale } from '../lib/messages.ts';

const site = 'https://ginseng.example.test';
const confirm = '11111111-1111-4111-8111-111111111111', unsubscribe = '22222222-2222-4222-8222-222222222222';

test('every newsletter email carries RFC 8058 one-click unsubscribe headers', () => {
  assert.deepEqual(listUnsubscribeHeaders(site, unsubscribe), {
    'List-Unsubscribe': `<${site}/api/unsubscribe/one-click?token=${unsubscribe}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  });
});

test('the confirmation email links to the confirm page in the subscriber language', () => {
  assert.equal(confirmUrl(site, 'en', confirm), `${site}/en/newsletter/confirm?token=${confirm}`);
  const zh = confirmationEmail(site, 'zh-TW', 'a@example.test', confirm, unsubscribe);
  assert.equal(zh.to, 'a@example.test');
  assert.equal(zh.subject, '請確認訂閱人蔘電子報');
  assert.ok(zh.text.includes(`${site}/newsletter/confirm?token=${confirm}`));
  assert.ok(zh.html.includes(`href="${site}/newsletter/confirm?token=${confirm}"`));
  assert.equal(zh.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
  const en = confirmationEmail(site, 'en', 'a@example.test', confirm, unsubscribe);
  assert.equal(en.from.name, 'Ginseng Try Catch');
  assert.ok(en.html.includes('/en/newsletter/confirm?token='));
});

test('API messages follow the form language and fall back to Chinese', () => {
  assert.equal(message('invalidEmail', 'en'), 'Please enter a valid email address.');
  assert.equal(message('invalidEmail'), '請填寫有效的 Email。');
  assert.equal(requestLocale(new Request('https://x.test', {headers: {'X-Site-Locale': 'en'}})), 'en');
  assert.equal(requestLocale(new Request('https://x.test', {headers: {'X-Site-Locale': 'fr'}})), 'zh-TW');
});
