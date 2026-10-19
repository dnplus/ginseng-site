import handler from 'vinext/server/fetch-handler';

export default {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    const response = await handler.fetch(request, env, ctx);
    const pathname = new URL(request.url).pathname;
    if (pathname === '/studio' || pathname.startsWith('/studio/') || pathname.startsWith('/api/studio/')) {
      const privateResponse = new Response(response.body, response);
      privateResponse.headers.set('Cache-Control', 'private, no-store');
      return privateResponse;
    }
    return response;
  },
};
