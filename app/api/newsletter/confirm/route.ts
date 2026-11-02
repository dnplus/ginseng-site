import { CONFIRM_TTL_MS } from '@/lib/newsletter-email';
import { syncQuietly } from '@/lib/subscriber-sync';
import { body, database, failure, FormError, json, rateLimit } from '@/lib/server';

export async function POST(request: Request) {
  try {
    const data = await body(request);
    if (typeof data.token !== 'string' || !/^[0-9a-f-]{36}$/.test(data.token)) throw new FormError('badConfirmLink');
    await rateLimit(request, 'confirm');
    const now = new Date(), cutoff = new Date(now.getTime() - CONFIRM_TTL_MS).toISOString();
    const db = database();
    const row = await db.prepare("UPDATE subscribers SET status = 'active', confirmed_at = ?, confirm_token = NULL, resend_sync = 'pending', updated_at = ? WHERE confirm_token = ? AND status = 'pending' AND confirm_sent_at >= ? RETURNING email").bind(now.toISOString(), now.toISOString(), data.token, cutoff).first<{email: string}>();
    if (row) { await syncQuietly(db, row.email); return json({ok: true}); }
    const known = await db.prepare('SELECT 1 FROM subscribers WHERE confirm_token = ?').bind(data.token).first();
    throw known ? new FormError('expiredConfirmLink', 410) : new FormError('badConfirmLink', 404);
  } catch (error) { return failure(error, request); }
}
