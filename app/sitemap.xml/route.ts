import { postPath } from '@/lib/blog';
import { siteOrigin } from '@/lib/feeds';
import { HTML_LANG, LOCALES, localePath, DEFAULT_LOCALE, type Locale } from '@/lib/i18n';
import { issues, posts } from '@/lib/posts';

const xml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const PAGES = ['/', '/about', '/blog', '/newsletter', '/lab', '/community', '/privacy'];

export function GET(request: Request) {
  const origin = siteOrigin(request);
  const entry = (locale: Locale, path: string, available: readonly Locale[], lastmod?: string) => {
    const links = available.map(each => `<xhtml:link rel="alternate" hreflang="${HTML_LANG[each]}" href="${xml(origin + localePath(each, path))}"/>`).join('');
    const fallback = available.includes(DEFAULT_LOCALE) ? `<xhtml:link rel="alternate" hreflang="x-default" href="${xml(origin + localePath(DEFAULT_LOCALE, path))}"/>` : '';
    return `<url><loc>${xml(origin + localePath(locale, path))}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}${links}${fallback}</url>`;
  };
  const urls = [
    ...PAGES.flatMap(path => LOCALES.map(locale => entry(locale, path, LOCALES))),
    ...posts.all.map(post => entry(post.locale, postPath(post), posts.translations(post).map(each => each.locale), post.date)),
    ...issues.all.map(issue => entry(issue.locale, `/newsletter/${issue.slug}`, issues.translations(issue).map(each => each.locale), issue.date)),
  ].join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`, {headers: {'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600'}});
}
