import handler from 'vinext/server/fetch-handler';
import { localeOf } from './lib/i18n';
import { LOCALE_HEADER } from './lib/locale-header';
import { ANALYTICS_HEADER, analyticsAllowed } from './lib/analytics';

export default {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    const pathname = new URL(request.url).pathname;
    // Overwrite whatever the caller sent: the locale and whether analytics may load come from the path only.
    const localized = new Request(request);
    localized.headers.set(LOCALE_HEADER, localeOf(pathname));
    localized.headers.set(ANALYTICS_HEADER, analyticsAllowed(pathname) ? 'on' : 'off');
    const response = await handler.fetch(localized, env, ctx);
    const isStudio = pathname === '/studio' || pathname.startsWith('/studio/') || pathname.startsWith('/api/studio/');
    if (!isStudio && analyticsAllowed(pathname)) return response;
    const privateResponse = new Response(response.body, response);
    if (isStudio) privateResponse.headers.set('Cache-Control', 'private, no-store');
    // Pages without analytics may carry a personal token in their URL; with no referrer, the next page (which does load
    // GTM) cannot pass that URL on to GA4 as page_referrer.
    if (!analyticsAllowed(pathname)) privateResponse.headers.set('Referrer-Policy', 'no-referrer');
    return privateResponse;
  },
};
