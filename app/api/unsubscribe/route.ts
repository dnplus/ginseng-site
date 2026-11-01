import { body, database, failure, FormError, json, rateLimit } from '@/lib/server';
import { UNSUBSCRIBE_SQL } from '@/lib/subscribers';
import { syncQuietly } from '@/lib/subscriber-sync';
export async function POST(request: Request) {
  try {
    const data = await body(request);
    if (typeof data.token !== 'string' || !/^[0-9a-f-]{36}$/.test(data.token)) throw new FormError('badUnsubscribeLink');
    await rateLimit(request, 'unsubscribe');
    const db = database();
    const row = await db.prepare(UNSUBSCRIBE_SQL).bind(new Date().toISOString(), data.token).first<{email: string}>();
    if (!row) throw new FormError('unknownSubscription', 404);
    await syncQuietly(db, row.email);
    return json({ok: true});
  } catch (error) { return failure(error, request); }
}
