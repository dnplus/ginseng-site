import { body, database, failure, FormError, json, rateLimit } from '@/lib/server';
import { cleanEmail, CONSENT_VERSION } from '@/lib/validation';
export async function POST(request: Request) {
  try {
    const data = await body(request);
    if (data.website) return json({ok: true});
    const email = cleanEmail(data.email);
    if (!email) throw new FormError('請填寫有效的 Email。');
    if (data.consent !== true) throw new FormError('請先同意訂閱與資料使用說明。');
    await rateLimit(request, 'subscribe');
    const now = new Date().toISOString();
    await database().prepare('INSERT INTO subscribers (id, email, status, unsubscribe_token, consent_version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET status = excluded.status, consent_version = excluded.consent_version, updated_at = excluded.updated_at').bind(crypto.randomUUID(), email, 'active', crypto.randomUUID(), CONSENT_VERSION, now, now).run();
    return json({ok: true});
  } catch (error) { return failure(error); }
}
