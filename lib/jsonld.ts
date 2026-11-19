import { postImage, postPath, type Post } from './blog.ts';
import { dictionary, HTML_LANG, localePath, type Locale } from './i18n.ts';
import { BRAND, socials } from './site.ts';
import { thumbnail, watchUrl } from './youtube.ts';

const cleanOrigin = (origin: string) => origin.replace(/\/+$/, '');
const absolute = (origin: string, url: string) => /^https?:\/\//.test(url) ? url : `${cleanOrigin(origin)}${url}`;

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}

export function homeJsonLd(origin: string, locale: Locale) {
  const base = cleanOrigin(origin);
  const brand = locale === 'en' ? BRAND.en : BRAND.zh;
  const url = `${base}${localePath(locale, '/')}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: brand,
        url,
        inLanguage: HTML_LANG[locale],
        description: dictionary(locale).meta.description,
      },
      {
        '@type': 'Person',
        name: brand,
        url: base,
        sameAs: socials(locale).map(each => each.url),
      },
    ],
  };
}

export function postJsonLd(post: Post, origin: string) {
  const base = cleanOrigin(origin);
  const brand = post.locale === 'en' ? BRAND.en : BRAND.zh;
  const t = dictionary(post.locale);
  const homeUrl = `${base}${localePath(post.locale, '/')}`;
  const blogUrl = `${base}${localePath(post.locale, '/blog')}`;
  const url = `${base}${localePath(post.locale, postPath(post))}`;
  const image = postImage(post);
  const author = {'@type': 'Person', name: brand, url: base};

  const posting: Record<string, unknown> = {
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.date,
    inLanguage: HTML_LANG[post.locale],
    url,
    mainEntityOfPage: {'@type': 'WebPage', '@id': url},
    author,
    publisher: author,
  };
  if (post.summary) posting.description = post.summary;
  if (image) posting.image = absolute(base, image);
  if (post.tags.length) posting.keywords = post.tags.join(', ');
  if (post.youtube) {
    posting.video = {
      '@type': 'VideoObject',
      name: post.title,
      thumbnailUrl: thumbnail(post.youtube),
      embedUrl: `https://www.youtube.com/embed/${post.youtube}`,
      contentUrl: watchUrl(post.youtube),
      uploadDate: post.date,
    };
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      posting,
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {'@type': 'ListItem', position: 1, name: brand, item: homeUrl},
          {'@type': 'ListItem', position: 2, name: t.nav.blog, item: blogUrl},
          {'@type': 'ListItem', position: 3, name: post.title, item: url},
        ],
      },
    ],
  };
}
