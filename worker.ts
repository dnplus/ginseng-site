import handler from 'vinext/server/fetch-handler';
import { localeOf } from './lib/i18n';
import { LOCALE_HEADER } from './lib/locale-header';

export default {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    const pathname = new URL(request.url).pathname;
    // Overwrite whatever the caller sent: the locale comes from the path only.
    const localized = new Request(request);
    localized.headers.set(LOCALE_HEADER, localeOf(pathname));
    const response = await handler.fetch(localized, env, ctx);
    if (pathname === '/studio' || pathname.startsWith('/studio/') || pathname.startsWith('/api/studio/')) {
      const privateResponse = new Response(response.body, response);
      privateResponse.headers.set('Cache-Control', 'private, no-store');
      return privateResponse;
    }
    return response;
  },
};
