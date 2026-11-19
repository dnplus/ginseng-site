import type { Metadata } from 'next';
import { alternates, dictionary, LOCALES, OG_LOCALE, type Locale } from './i18n';

type OgImage = {url: string; width: number; height: number};
/** Social preview for /lab: the lab cards' pictures in a 2x2 grid (public/lab/og.jpg). */
export const LAB_OG_IMAGE: OgImage = {url: '/lab/og.jpg', width: 1200, height: 630};

/** Page metadata with per-language canonical and hreflang links. `available` lists the languages this page exists in. */
export function pageMetadata(locale: Locale, path: string, options: {title?: string; description?: string; available?: readonly Locale[]; ogType?: 'website' | 'article'; image?: string | OgImage} = {}): Metadata {
  const t = dictionary(locale).meta;
  const title = options.title ?? t.title, description = options.description ?? t.description;
  const available = options.available ?? LOCALES;
  return {
    title, description,
    alternates: alternates(locale, path, available),
    openGraph: {
      title: options.title ?? t.ogTitle, description: options.description ?? t.ogDescription,
      images: [typeof options.image === 'string' ? {url: options.image} : options.image ?? {url: '/assets/ginseng.png', width: 1254, height: 1254}],
      locale: OG_LOCALE[locale], alternateLocale: available.filter(each => each !== locale).map(each => OG_LOCALE[each]),
      type: options.ogType ?? 'website',
    },
    twitter: {card: 'summary_large_image', site: '@ginsengtrycatch', creator: '@ginsengtrycatch'},
  };
}
