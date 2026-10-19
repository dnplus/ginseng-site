import { body, database, failure, FormError, json, rateLimit } from '@/lib/server';
export async function POST(request: Request) {
  try {
    const data = await body(request);
    if (typeof data.token !== 'string' || !/^[0-9a-f-]{36}$/.test(data.token)) throw new FormError('退訂連結不完整，請使用信件中的連結。');
    await rateLimit(request, 'unsubscribe');
    const result = await database().prepare("UPDATE subscribers SET status = 'unsubscribed', updated_at = ? WHERE unsubscribe_token = ?").bind(new Date().toISOString(), data.token).run();
    if (!result.meta.changes) throw new FormError('找不到這筆訂閱，請確認退訂連結。', 404);
    return json({ok: true});
  } catch (error) { return failure(error); }
}
