import handler from 'vinext/server/fetch-handler';
import { localeOf } from './lib/i18n';
import { LOCALE_HEADER } from './lib/locale-header';
import { ANALYTICS_HEADER, analyticsAllowed } from './lib/analytics';
import { rootDomainResponse } from './lib/ads';

export default {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    const url = new URL(request.url), pathname = url.pathname;
    const root = rootDomainResponse(url);
    if (root) return root;
    // Overwrite whatever the caller sent: the locale and whether analytics may load come from the path only.
    const localized = new Request(request);
    localized.headers.set(LOCALE_HEADER, localeOf(pathname));
    localized.headers.set(ANALYTICS_HEADER, analyticsAllowed(pathname) ? 'on' : 'off');
    const response = await handler.fetch(localized, env, ctx);
    const secured = new Response(response.body, response);
    secured.headers.set('X-Content-Type-Options', 'nosniff');
    secured.headers.set('X-Frame-Options', 'SAMEORIGIN');
    const isStudio = pathname === '/studio' || pathname.startsWith('/studio/') || pathname.startsWith('/api/studio/');
    if (isStudio) secured.headers.set('Cache-Control', 'private, no-store');
    secured.headers.set('Referrer-Policy', analyticsAllowed(pathname) ? 'strict-origin-when-cross-origin' : 'no-referrer');
    return secured;
  },
};
