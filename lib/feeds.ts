import { env } from 'cloudflare:workers';
import { postPath } from './blog';
import { dictionary, HTML_LANG, localePath, type Locale } from './i18n';
import { posts, renderMarkdown } from './posts';

const xml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export const siteOrigin = (request: Request) => (env.SITE_URL || new URL(request.url).origin).replace(/\/$/, '');

/** RSS 2.0 per language. Newsletter tools can turn this into a digest. */
export function feed(locale: Locale, request: Request) {
  const origin = siteOrigin(request), t = dictionary(locale);
  const items = posts.list(locale).slice(0, 30).map(post => {
    const link = `${origin}${localePath(locale, postPath(post))}`;
    return `<item><title>${xml(post.title)}</title><link>${xml(link)}</link><guid isPermaLink="true">${xml(link)}</guid><pubDate>${new Date(`${post.date}T12:00:00+08:00`).toUTCString()}</pubDate>${post.summary ? `<description>${xml(post.summary)}</description>` : ''}<content:encoded><![CDATA[${renderMarkdown(post.body).replaceAll(']]>', ']]]]><![CDATA[>')}]]></content:encoded>${post.tags.map(tag => `<category>${xml(tag)}</category>`).join('')}</item>`;
  }).join('');
  const self = `${origin}${localePath(locale, '/feed.xml')}`;
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>${xml(t.blog.title)}</title><link>${xml(`${origin}${localePath(locale, '/blog')}`)}</link><description>${xml(t.blog.description)}</description><language>${HTML_LANG[locale]}</language><atom:link href="${xml(self)}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
  return new Response(body, {headers: {'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=900'}});
}
