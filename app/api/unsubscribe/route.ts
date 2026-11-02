import { body, database, failure, FormError, json, rateLimit } from '@/lib/server';
import { UNSUBSCRIBE_SQL } from '@/lib/subscribers';
export async function POST(request: Request) {
  try {
    const data = await body(request);
    if (typeof data.token !== 'string' || !/^[0-9a-f-]{36}$/.test(data.token)) throw new FormError('badUnsubscribeLink');
    await rateLimit(request, 'unsubscribe');
    const result = await database().prepare(UNSUBSCRIBE_SQL).bind(new Date().toISOString(), data.token).run();
    if (!result.meta.changes) throw new FormError('unknownSubscription', 404);
    return json({ok: true});
  } catch (error) { return failure(error, request); }
}
