import { env } from 'cloudflare:workers';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n';
import { requestLocale } from '@/lib/messages';
import { CONFIRM_RESEND_MS, confirmationEmail } from '@/lib/newsletter-email';
import { body, database, failure, FormError, json, rateLimit } from '@/lib/server';
import { cleanEmail, CONSENT_VERSION } from '@/lib/validation';

type Existing = {status: string; unsubscribe_token: string; confirm_sent_at: string | null};

/**
 * Double opt-in: a new or returning address becomes 'pending' and gets a confirmation email; only the link in it makes
 * the subscription active. The response is the same whether or not the address is already subscribed.
 */
export async function POST(request: Request) {
  try {
    const data = await body(request);
    if (data.website) return json({ok: true});
    const email = cleanEmail(data.email);
    if (!email) throw new FormError('invalidEmail');
    if (data.consent !== true) throw new FormError('subscribeConsent');
    await rateLimit(request, 'subscribe');
    const locale = isLocale(data.locale) ? data.locale : DEFAULT_LOCALE;
    const db = database();
    const existing = await db.prepare('SELECT status, unsubscribe_token, confirm_sent_at FROM subscribers WHERE email = ?').bind(email).first<Existing>();
    if (existing?.status === 'active') return json({ok: true});
    const now = new Date();
    if (existing?.status === 'pending' && existing.confirm_sent_at && now.getTime() - Date.parse(existing.confirm_sent_at) < CONFIRM_RESEND_MS) return json({ok: true});
    const confirmToken = crypto.randomUUID(), unsubscribeToken = existing?.unsubscribe_token ?? crypto.randomUUID(), at = now.toISOString();
    await db.prepare(`INSERT INTO subscribers (id, email, status, unsubscribe_token, consent_version, created_at, updated_at, locale, source, confirm_token, confirm_sent_at)
      VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, 'website', ?, ?)
      ON CONFLICT(email) DO UPDATE SET status = 'pending', consent_version = excluded.consent_version, updated_at = excluded.updated_at, locale = excluded.locale, confirm_token = excluded.confirm_token, confirm_sent_at = excluded.confirm_sent_at
      WHERE subscribers.status != 'active'`).bind(crypto.randomUUID(), email, unsubscribeToken, CONSENT_VERSION, at, at, locale, confirmToken, at).run();
    const site = (env.SITE_URL || new URL(request.url).origin).replace(/\/$/, '');
    try {
      await env.NEWSLETTER_EMAIL.send(confirmationEmail(site, locale, email, confirmToken, unsubscribeToken));
    } catch {
      // Let the visitor retry right away instead of waiting out the resend window.
      await db.prepare('UPDATE subscribers SET confirm_sent_at = NULL WHERE email = ? AND confirm_token = ?').bind(email, confirmToken).run();
      console.error('Newsletter confirmation email failed');
      throw new FormError('unavailable', 503);
    }
    return json({ok: true});
  } catch (error) { return failure(error, request); }
}
