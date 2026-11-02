import assert from 'node:assert/strict';
import { test } from 'node:test';
import { indexPosts, parseFrontMatter, parsePost } from '../lib/blog.ts';

const post = (front: string, body = 'Body') => `---\n${front}\n---\n${body}`;

test('front matter supports JSON strings, numbers, booleans and lists', () => {
  const {data, body} = parseFrontMatter(post('title: "說 \\"嗨\\"：AI"\nepisode: 79\ndraft: true\ntags: [Notion, AI Agent]\nlegacyUrl: https://example.com/a:b', '# Hi'));
  assert.deepEqual(data, {title: '說 "嗨"：AI', episode: 79, draft: true, tags: ['Notion', 'AI Agent'], legacyUrl: 'https://example.com/a:b'});
  assert.equal(body, '# Hi');
});

test('a post takes its locale and slug from the path and validates required fields', () => {
  const parsed = parsePost('/content/posts/en/hello-world.md', post('title: Hello\ndate: 2026-11-01\ntranslatedFrom: zh-TW'));
  assert.equal(parsed.locale, 'en');
  assert.equal(parsed.slug, 'hello-world');
  assert.equal(parsed.translatedFrom, 'zh-TW');
  assert.throws(() => parsePost('/content/posts/fr/x.md', post('title: X\ndate: 2026-11-01')), /unknown locale/);
  assert.throws(() => parsePost('/content/posts/en/Bad_Slug.md', post('title: X\ndate: 2026-11-01')), /slug/);
  assert.throws(() => parsePost('/content/posts/en/x.md', post('date: 2026-11-01')), /title/);
  assert.throws(() => parsePost('/content/posts/en/x.md', post('title: X\ndate: 11/01/2026')), /date/);
  assert.throws(() => parsePost('/content/posts/en/x.md', post('title: X\ndate: 2026-11-01\nepisode: abc')), /episode/);
});

test('the index hides drafts, sorts newest first, and links translations and episodes', () => {
  const files = {
    '/content/posts/zh-TW/ep079.md': post('title: 中文\ndate: 2026-10-18\nepisode: 79'),
    '/content/posts/en/ep079.md': post('title: English\ndate: 2026-10-20\nepisode: 79\ntranslatedFrom: zh-TW'),
    '/content/posts/zh-TW/ep080.md': post('title: 新\ndate: 2026-10-25\nepisode: 80'),
    '/content/posts/zh-TW/ep081.md': post('title: 草稿\ndate: 2026-10-30\nepisode: 81\ndraft: true'),
  };
  const index = indexPosts(files);
  assert.deepEqual(index.list('zh-TW').map(each => each.slug), ['ep080', 'ep079']);
  assert.equal(index.find('zh-TW', 'ep081'), null);
  assert.deepEqual(index.translations(index.find('en', 'ep079')!).map(each => each.locale).sort(), ['en', 'zh-TW']);
  assert.equal(index.episode(79)?.locale, 'zh-TW');
  assert.equal(index.episode(81), null);
  assert.equal(indexPosts(files, true).episode(81)?.slug, 'ep081');
});

test('feeds and emails get absolute links and images', async () => {
  const {absolutize} = await import('../lib/html.ts');
  assert.equal(absolutize('<a href="/blog/x">x</a><img src="/blog/x/zh-TW-01.png" alt=""><a href="https://a.test/">a</a><a href="//cdn.test/y">y</a>', 'https://site.test/'),
    '<a href="https://site.test/blog/x">x</a><img src="https://site.test/blog/x/zh-TW-01.png" alt=""><a href="https://a.test/">a</a><a href="//cdn.test/y">y</a>');
});
