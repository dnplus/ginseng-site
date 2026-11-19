import assert from 'node:assert/strict';
import { test } from 'node:test';
import { indexPosts, parseFrontMatter, parsePost, postImage, relatedPosts } from '../lib/blog.ts';
import { homeJsonLd, postJsonLd, serializeJsonLd } from '../lib/jsonld.ts';

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

test('postImage prefers cover over youtube thumbnail over firstImage', () => {
  assert.equal(postImage({cover: '/blog/ep093/cover.jpg', youtube: 'SP-pwffKN3g', firstImage: '/blog/ep093/a.jpg'}), '/blog/ep093/cover.jpg');
  assert.equal(postImage({cover: null, youtube: 'SP-pwffKN3g', firstImage: '/blog/ep093/a.jpg'}), 'https://i.ytimg.com/vi/SP-pwffKN3g/maxresdefault.jpg');
  assert.equal(postImage({cover: null, youtube: 'SP-pwffKN3g', firstImage: '/blog/ep093/a.jpg'}, 'mqdefault'), 'https://i.ytimg.com/vi/SP-pwffKN3g/mqdefault.jpg');
  assert.equal(postImage({cover: null, youtube: null, firstImage: '/blog/ep093/a.jpg'}), '/blog/ep093/a.jpg');
  assert.equal(postImage({cover: null, youtube: null, firstImage: null}), null);
});

test('relatedPosts ranks same-locale posts by shared tags then newest date', () => {
  const index = indexPosts({
    '/content/posts/zh-TW/a.md': post('title: A\ndate: 2026-11-10\ntags: [Notion, MCP, Claude]'),
    '/content/posts/zh-TW/b.md': post('title: B\ndate: 2026-11-01\ntags: [notion, mcp]'),
    '/content/posts/zh-TW/c.md': post('title: C\ndate: 2026-11-09\ntags: [Claude]'),
    '/content/posts/zh-TW/d.md': post('title: D\ndate: 2026-11-08\ntags: [Other]'),
    '/content/posts/en/e.md': post('title: E\ndate: 2026-11-11\ntags: [Notion, MCP, Claude]'),
  });
  const target = index.find('zh-TW', 'a')!;
  assert.deepEqual(relatedPosts(target, index.all, 3).map(each => each.slug), ['b', 'c', 'd']);
});

test('JSON-LD builders emit valid structured data and escape script-closing sequences', () => {
  const parsed = parsePost('/content/posts/zh-TW/ep093.md', post('title: "A </script> B"\ndate: 2026-11-09\nsummary: Test\ncover: /blog/ep093/cover.jpg\nyoutube: SP-pwffKN3g\ntags: [Notion, MCP]'));
  const ld = postJsonLd(parsed, 'https://ginseng.dnplus.dev/');
  const posting = ld['@graph'][0] as Record<string, unknown>;
  assert.equal(posting['@type'], 'BlogPosting');
  assert.equal(posting.image, 'https://ginseng.dnplus.dev/blog/ep093/cover.jpg');
  assert.equal((posting.video as Record<string, unknown>)['@type'], 'VideoObject');
  assert.equal(ld['@graph'][1]['@type'], 'BreadcrumbList');
  const serialized = serializeJsonLd(ld);
  assert.ok(!serialized.includes('</script>'));
  assert.equal(homeJsonLd('https://ginseng.dnplus.dev', 'zh-TW')['@graph'][0]['@type'], 'WebSite');
});
