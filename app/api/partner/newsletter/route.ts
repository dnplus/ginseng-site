import { env } from 'cloudflare:workers';
import { verifyPartner, newsletterLocale } from '@/lib/partner-auth';
import { syncQuietly } from '@/lib/subscriber-sync';
import { database, json } from '@/lib/server';
import { cleanEmail } from '@/lib/validation';

const SOURCES = new Set(['pa-cafe']);

/**
 * Newsletter subscriptions from other Ginseng Try Catch products, signed with NEWSLETTER_PARTNER_SECRET (see
 * lib/partner-auth.ts). Body: {action: 'status' | 'subscribe' | 'unsubscribe', email, source, locale?, consent?}.
 *
 * `subscribe` needs `consent: {version, text}`, the exact opt-in the person ticked in the product, and is applied
 * immediately: the product's sign-in already verified that the person owns the address, which is what the confirmation
 * email proves on the website. The answer is the address's newsletter status, so the product can show its toggle.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 4096) return json({error: 'too large'}, 413);
  if (!await verifyPartner(env.NEWSLETTER_PARTNER_SECRET, request.headers, raw)) return json({error: 'invalid signature'}, 403);
  let data: Record<string, unknown>;
  try { data = JSON.parse(raw); } catch { return json({error: 'invalid json'}, 400); }
  const email = cleanEmail(data.email), action = data.action, source = String(data.source);
  if (!email || !SOURCES.has(source) || !['status', 'subscribe', 'unsubscribe'].includes(String(action))) return json({error: 'invalid request'}, 400);
  const db = database(), now = new Date().toISOString();
  const current = () => db.prepare('SELECT status FROM subscribers WHERE email = ?').bind(email).first<{status: string}>().then(row => row?.status ?? 'none');

  if (action === 'subscribe') {
    const consent = data.consent as {version?: unknown; text?: unknown} | undefined;
    if (typeof consent?.version !== 'string' || !consent.version || consent.version.length > 64 || typeof consent.text !== 'string' || !consent.text || consent.text.length > 500) return json({error: 'consent required'}, 400);
    const locale = newsletterLocale(data.locale), version = `${source}:${consent.version}`;
    await db.prepare(`INSERT INTO subscribers (id, email, status, unsubscribe_token, consent_version, created_at, updated_at, locale, source, confirmed_at, resend_sync)
      VALUES (?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, 'pending')
      ON CONFLICT(email) DO UPDATE SET status = 'active', consent_version = excluded.consent_version, updated_at = excluded.updated_at, locale = excluded.locale, source = excluded.source, confirmed_at = excluded.confirmed_at, confirm_token = NULL, resend_sync = 'pending'
      WHERE subscribers.status != 'active'`).bind(crypto.randomUUID(), email, crypto.randomUUID(), version, now, now, locale, source, now).run();
    await syncQuietly(db, email);
  } else if (action === 'unsubscribe') {
    const changed = await db.prepare("UPDATE subscribers SET status = 'unsubscribed', confirm_token = NULL, resend_sync = 'pending', updated_at = ? WHERE email = ? AND status != 'unsubscribed' RETURNING email").bind(now, email).first();
    if (changed) await syncQuietly(db, email);
  }
  return json({ok: true, status: await current()});
}
