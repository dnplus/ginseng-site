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

test('a post knows its explicit cover and its first site image, so every list card can show a picture', () => {
  const parsed = parsePost('/content/posts/zh-TW/ep083.md', post('title: X\ndate: 2026-10-24', 'Intro\n\n![外部](https://example.com/a.png)\n\n![第一張](/blog/ep083/zh-TW-01.webp)\n\n![第二張](/blog/ep083/zh-TW-02.webp)'));
  assert.equal(parsed.cover, null);
  assert.equal(parsed.firstImage, '/blog/ep083/zh-TW-01.webp', 'external images are skipped');
  const covered = parsePost('/content/posts/zh-TW/ep087.md', post('title: X\ndate: 2026-10-31\nyoutube: SP-pwffKN3g\ncover: /blog/ep087/zh-TW-03.webp'));
  assert.equal(covered.cover, '/blog/ep087/zh-TW-03.webp');
  assert.equal(parsePost('/content/posts/zh-TW/x.md', post('title: X\ndate: 2026-10-31')).firstImage, null);
  assert.throws(() => parsePost('/content/posts/zh-TW/x.md', post('title: X\ndate: 2026-10-31\ncover: https://example.com/a.png')), /cover/);
});

test('a video finds its article: same language first, then the default language', () => {
  const index = indexPosts({
    '/content/posts/zh-TW/ep079.md': post('title: 中文\ndate: 2026-10-18\nyoutube: abcdefghijk'),
    '/content/posts/en/ep079.md': post('title: English\ndate: 2026-10-20\nyoutube: abcdefghijk\ntranslatedFrom: zh-TW'),
    '/content/posts/zh-TW/ep080.md': post('title: 只有中文\ndate: 2026-10-25\nyoutube: zh-only-123'),
  });
  assert.equal(index.video('abcdefghijk', 'en')?.locale, 'en');
  assert.equal(index.video('abcdefghijk', 'zh-TW')?.locale, 'zh-TW');
  assert.equal(index.video('zh-only-123', 'en')?.locale, 'zh-TW', 'an untranslated episode still links to its Mandarin article');
  assert.equal(index.video('not-a-video', 'zh-TW'), null);
});

test('the latest episode in the repository (ep095) links to its article', async () => {
  const {readdirSync, readFileSync} = await import('node:fs');
  const root = new URL('../content/posts/', import.meta.url);
  const files: Record<string, string> = {};
  for (const locale of readdirSync(root)) for (const name of readdirSync(new URL(`${locale}/`, root)).filter(each => each.endsWith('.md')))
    files[`/content/posts/${locale}/${name}`] = readFileSync(new URL(`${locale}/${name}`, root), 'utf8');
  assert.equal(indexPosts(files).video('2QEyUXbNedY', 'zh-TW')?.slug, 'ep095');
});
