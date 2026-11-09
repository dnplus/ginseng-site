/**
 * Google Tag Manager. The container id is the `GTM_ID` var in wrangler.jsonc (public, like any GTM id). It loads only when
 * SITE_URL is https, so local development (http://localhost) is not counted. GA4 itself is configured inside the container.
 *
 * worker.ts decides per path whether a page may load GTM and passes that to the layout in ANALYTICS_HEADER, overwriting
 * anything the caller sent. Pages whose URL carries a personal token (unsubscribe, newsletter confirmation) and the
 * private studio never load it, so no token or admin page reaches Google.
 */
export const ANALYTICS_HEADER = 'x-ginseng-analytics';

const PRIVATE_PAGE = /^(?:\/en)?\/(?:studio|unsubscribe|newsletter\/confirm)(?:\/|$)/;
export const analyticsAllowed = (pathname: string) => !PRIVATE_PAGE.test(pathname);

export const validGtmId = (id: string | undefined) => (id && /^GTM-[A-Z0-9]{4,12}$/.test(id) ? id : null);

/** Google's standard container snippet; `id` is validated, so it is safe to inline. */
export const gtmSnippet = (id: string) =>
  `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`;

type DataLayerWindow = Window & { dataLayer?: unknown[] };
export type AnalyticsEvent = 'newsletter_signup' | 'contact_submit';

/** Push a conversion to GTM's dataLayer. Never include the email, name or message: only what GA4 should count. */
export function track(event: AnalyticsEvent, params: Record<string, string> = {}) {
  if (typeof window === 'undefined') return;
  const w = window as DataLayerWindow;
  (w.dataLayer ??= []).push({event, ...params});
}
