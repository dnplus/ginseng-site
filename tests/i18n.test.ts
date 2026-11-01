import assert from 'node:assert/strict';
import { test } from 'node:test';
import { alternates, localeOf, localePath } from '../lib/i18n.ts';

test('the default language stays at the root and English gets a prefix', () => {
  assert.equal(localePath('zh-TW', '/'), '/');
  assert.equal(localePath('zh-TW', '/lab'), '/lab');
  assert.equal(localePath('en', '/'), '/en');
  assert.equal(localePath('en', '/lab'), '/en/lab');
  assert.equal(localePath('en', 'blog/ep087'), '/en/blog/ep087');
});

test('a path belongs to English only under /en', () => {
  assert.equal(localeOf('/'), 'zh-TW');
  assert.equal(localeOf('/en'), 'en');
  assert.equal(localeOf('/en/lab'), 'en');
  assert.equal(localeOf('/english'), 'zh-TW');
  assert.equal(localeOf('/lab'), 'zh-TW');
});

test('hreflang alternates list only the languages a page exists in', () => {
  assert.deepEqual(alternates('en', '/lab'), {canonical: '/en/lab', languages: {'zh-Hant-TW': '/lab', en: '/en/lab', 'x-default': '/lab'}});
  assert.deepEqual(alternates('zh-TW', '/blog/ep087', ['zh-TW']), {canonical: '/blog/ep087', languages: {'zh-Hant-TW': '/blog/ep087', 'x-default': '/blog/ep087'}});
  assert.deepEqual(alternates('en', '/blog/x', ['en']).languages, {en: '/en/blog/x'});
});
