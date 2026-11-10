import { isLocale, LOCALES, type Locale } from './i18n.ts';

/**
 * Blog posts are Markdown files at `content/posts/<locale>/<slug>.md` with a small front matter block. A translation
 * uses the same slug in another locale folder, so `/blog/x` and `/en/blog/x` are the same article. Kept in git so
 * agents can write and edit them, and so nothing depends on Notion's expiring image URLs at request time.
 *
 * Front matter (one `key: value` per line; strings may be quoted; lists use `[a, b]`):
 *   title        required
 *   date         required, YYYY-MM-DD
 *   summary      one or two sentences for lists, feeds and meta description
 *   episode      channel episode number, e.g. 87; makes /ep/087 point here
 *   youtube      YouTube video id of the episode
 *   cover        site image for lists, e.g. /blog/ep087/zh-TW-01.webp; wins over the YouTube thumbnail (use it while
 *                the video is private, since YouTube then serves a grey placeholder)
 *   tags         [Notion, AI Agent]
 *   translatedFrom  locale the post was translated from; shows a "translated" note
 *   legacyUrl    the old Notion URL, kept for reference
 *   draft        true keeps the post out of production builds
 */
export type Post = {
  locale: Locale; slug: string; title: string; date: string; summary: string; episode: number | null; youtube: string | null;
  /** Front matter `cover`: the list image, ahead of the YouTube thumbnail. */
  cover: string | null;
  /** The post's first site image; the list image when there is neither a cover nor a video. */
  firstImage: string | null;
  tags: string[]; translatedFrom: Locale | null; legacyUrl: string | null; draft: boolean; body: string;
};

type Value = string | number | boolean | string[];
function scalar(raw: string): Value {
  const text = raw.trim();
  if (text.startsWith('[') && text.endsWith(']')) return text.slice(1, -1).split(',').map(item => String(scalar(item))).filter(Boolean);
  // Double-quoted strings are JSON strings (the import scripts write them with JSON.stringify).
  if (text.startsWith('"') && text.endsWith('"')) return JSON.parse(text) as string;
  if (text.startsWith("'") && text.endsWith("'")) return text.slice(1, -1);
  if (text === 'true' || text === 'false') return text === 'true';
  if (/^-?\d+$/.test(text)) return Number(text);
  return text;
}

export function parseFrontMatter(source: string): {data: Record<string, Value>; body: string} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!match) return {data: {}, body: source};
  const data: Record<string, Value> = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const at = line.indexOf(':');
    if (at < 1) throw new Error(`Front matter line without a key: ${line}`);
    data[line.slice(0, at).trim()] = scalar(line.slice(at + 1));
  }
  return {data, body: source.slice(match[0].length)};
}

/** First site-relative Markdown image (`![alt](/path)`) in a post body. */
const firstImage = (body: string) => /!\[[^\]]*\]\((\/[^\s)]+)/.exec(body)?.[1] ?? null;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const text = (value: Value | undefined) => typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';

/** Parse one file. `path` ends in `<locale>/<slug>.md`; anything malformed throws so a bad post fails the build. */
export function parsePost(path: string, source: string): Post {
  const match = /([^/]+)\/([^/]+)\.md$/.exec(path);
  if (!match) throw new Error(`Unexpected post path: ${path}`);
  const [, locale, slug] = match;
  if (!isLocale(locale)) throw new Error(`${path}: unknown locale folder "${locale}" (use one of ${LOCALES.join(', ')})`);
  if (!SLUG.test(slug)) throw new Error(`${path}: slug must be lowercase letters, digits and dashes`);
  const {data, body} = parseFrontMatter(source);
  const title = text(data.title), date = text(data.date);
  if (!title) throw new Error(`${path}: title is required`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new Error(`${path}: date must be YYYY-MM-DD`);
  const translatedFrom = data.translatedFrom === undefined ? null : text(data.translatedFrom);
  if (translatedFrom !== null && !isLocale(translatedFrom)) throw new Error(`${path}: translatedFrom must be a locale`);
  const episode = data.episode === undefined ? null : Number(data.episode);
  if (episode !== null && !(Number.isInteger(episode) && episode > 0)) throw new Error(`${path}: episode must be a positive integer`);
  const cover = text(data.cover) || null;
  if (cover !== null && !cover.startsWith('/')) throw new Error(`${path}: cover must be a site path such as /blog/${slug}/zh-TW-01.webp`);
  return {
    locale, slug, title, date, summary: text(data.summary), episode, youtube: text(data.youtube) || null,
    cover, firstImage: firstImage(body),
    tags: Array.isArray(data.tags) ? data.tags : [],
    translatedFrom: translatedFrom as Locale | null, legacyUrl: text(data.legacyUrl) || null, draft: data.draft === true, body,
  };
}

export type PostIndex = ReturnType<typeof indexPosts>;

/** Index parsed posts. Drafts are dropped unless `includeDrafts`; newest first. */
export function indexPosts(files: Record<string, string>, includeDrafts = false) {
  const all = Object.entries(files).map(([path, source]) => parsePost(path, source)).filter(post => includeDrafts || !post.draft)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  const seen = new Set<string>();
  for (const post of all) {
    const key = `${post.locale}/${post.slug}`;
    if (seen.has(key)) throw new Error(`Duplicate post ${key}`);
    seen.add(key);
  }
  return {
    all,
    list: (locale: Locale) => all.filter(post => post.locale === locale),
    find: (locale: Locale, slug: string) => all.find(post => post.locale === locale && post.slug === slug) ?? null,
    /** The same article in every language it exists in. */
    translations: (post: Post) => all.filter(other => other.slug === post.slug),
    /** The default-language post for a channel episode, falling back to any language. */
    episode: (number: number) => all.find(post => post.episode === number && post.locale === 'zh-TW') ?? all.find(post => post.episode === number) ?? null,
    /** The article for a YouTube video: in `locale` if translated, else the default language, else any language. */
    video: (id: string, locale: Locale) => {
      const matches = all.filter(post => post.youtube === id);
      return matches.find(post => post.locale === locale) ?? matches.find(post => post.locale === 'zh-TW') ?? matches[0] ?? null;
    },
  };
}

export const postPath = (post: Pick<Post, 'slug'>) => `/blog/${post.slug}`;
