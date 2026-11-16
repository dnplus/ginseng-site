/**
 * Google AdSense: one manual unit per article, before its sources section (or at the end of the body when it has none),
 * so it never cuts into the reading. No Auto ads. Ads load only on the deployed https site, like GTM.
 */
export const ADSENSE_CLIENT = 'ca-pub-6805910087572066';
export const ADSENSE_ARTICLE_SLOT = '3787906923';
export const adsenseScript = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

/** First h2 that opens a post's closing sources section; an <hr> right before it stays with it. */
const SOURCES = /(?:<hr\s*\/?>\s*)?<h2[^>]*>\s*(?:參考資料|延伸閱讀|資料來源|來源|References|Sources|Further reading)\s*<\/h2>/i;

/** Rendered article HTML split where the ad goes: [body before the ad, the rest]. */
export function splitForAd(html: string): [string, string] {
  const match = SOURCES.exec(html);
  return match ? [html.slice(0, match.index), html.slice(match.index)] : [html, ''];
}

/** The one ads.txt line, served at ginseng.dnplus.dev/ads.txt (public/ads.txt) and at the root domain, which AdSense checks. */
export const ADS_TXT = `google.com, ${ADSENSE_CLIENT.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n`;

export const SITE_HOST = 'ginseng.dnplus.dev';
export const ROOT_HOST = 'dnplus.dev';

/**
 * The root domain dnplus.dev has no site of its own. AdSense only registers root domains and verifies them through
 * dnplus.dev/ads.txt, so that path answers directly; every other path moves permanently to the same path on this site.
 */
export function rootDomainResponse(url: URL): Response | null {
  if (url.hostname !== ROOT_HOST) return null;
  if (url.pathname === '/ads.txt') return new Response(ADS_TXT, {headers: {'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600'}});
  return Response.redirect(`https://${SITE_HOST}${url.pathname}${url.search}`, 301);
}
