import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { env } from 'cloudflare:workers';
import { HTML_LANG, isLocale, DEFAULT_LOCALE } from '@/lib/i18n';
import { LOCALE_HEADER } from '@/lib/locale-header';
import { ANALYTICS_HEADER, gtmSnippet, validGtmId } from '@/lib/analytics';
import './globals.css';
export const metadata: Metadata = {
  ...(env.SITE_URL ? {metadataBase: new URL(env.SITE_URL)} : {}),
  icons: {icon:'/favicon.svg'},
};
export const viewport = {themeColor: '#263f35'};
const fonts = 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap';
export default async function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  // worker.ts derives the locale from the path; one root layout serves every language.
  const requestHeaders = await headers(), locale = requestHeaders.get(LOCALE_HEADER);
  // Only the deployed https site loads GTM; local development (SITE_URL http://localhost) is never counted.
  const gtm = requestHeaders.get(ANALYTICS_HEADER) === 'on' && env.SITE_URL?.startsWith('https://') ? validGtmId(env.GTM_ID) : null;
  const lang = HTML_LANG[isLocale(locale) ? locale : DEFAULT_LOCALE];
  return <html lang={lang}><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/><link rel="preconnect" href="https://i.ytimg.com"/><link rel="stylesheet" href={fonts}/>{gtm && <script dangerouslySetInnerHTML={{__html: gtmSnippet(gtm)}}/>}</head><body>{gtm && <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${gtm}`} height="0" width="0" style={{display: 'none', visibility: 'hidden'}}/></noscript>}{children}</body></html>;
}
