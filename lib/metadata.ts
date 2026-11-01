import type { Metadata } from 'next';
import { alternates, dictionary, LOCALES, OG_LOCALE, type Locale } from './i18n';

/** Page metadata with per-language canonical and hreflang links. `available` lists the languages this page exists in. */
export function pageMetadata(locale: Locale, path: string, options: {title?: string; description?: string; available?: readonly Locale[]; ogType?: 'website' | 'article'; image?: string} = {}): Metadata {
  const t = dictionary(locale).meta;
  const title = options.title ?? t.title, description = options.description ?? t.description;
  const available = options.available ?? LOCALES;
  return {
    title, description,
    alternates: alternates(locale, path, available),
    openGraph: {
      title: options.title ?? t.ogTitle, description: options.description ?? t.ogDescription,
      images: [options.image ? {url: options.image} : {url: '/assets/ginseng.png', width: 1254, height: 1254}],
      locale: OG_LOCALE[locale], alternateLocale: available.filter(each => each !== locale).map(each => OG_LOCALE[each]),
      type: options.ogType ?? 'website',
    },
  };
}
