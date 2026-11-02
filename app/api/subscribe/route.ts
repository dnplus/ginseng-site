import { env } from 'cloudflare:workers';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n';
import { requestLocale } from '@/lib/messages';
import { CONFIRM_RESEND_MS, confirmationEmail } from '@/lib/newsletter-email';
import { body, database, failure, FormError, json, rateLimit } from '@/lib/server';
import { cleanEmail, CONSENT_VERSION } from '@/lib/validation';

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
    const now = new Date(), at = now.toISOString(), resendCutoff = new Date(now.getTime() - CONFIRM_RESEND_MS).toISOString();
    const confirmToken = crypto.randomUUID();
    // One statement reserves the send: it only inserts or updates when the address is not active and no confirmation went
    // out within the resend window, so two overlapping requests cannot both send. The unsubscribe token comes back from
    // the row itself, so a returning address keeps its original link.
    // A brand-new address has nothing in Resend yet, so it starts in sync; an existing row keeps its own sync state.
    const reserved = await db.prepare(`INSERT INTO subscribers (id, email, status, unsubscribe_token, consent_version, created_at, updated_at, locale, source, confirm_token, confirm_sent_at, resend_sync)
      VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, 'website', ?, ?, 'done')
      ON CONFLICT(email) DO UPDATE SET status = 'pending', consent_version = excluded.consent_version, updated_at = excluded.updated_at, locale = excluded.locale, confirm_token = excluded.confirm_token, confirm_sent_at = excluded.confirm_sent_at
      WHERE subscribers.status != 'active' AND NOT (subscribers.status = 'pending' AND subscribers.confirm_sent_at IS NOT NULL AND subscribers.confirm_sent_at > ?)
      RETURNING unsubscribe_token, confirm_token`).bind(crypto.randomUUID(), email, crypto.randomUUID(), CONSENT_VERSION, at, at, locale, confirmToken, at, resendCutoff).first<{unsubscribe_token: string; confirm_token: string}>();
    if (reserved?.confirm_token !== confirmToken) return json({ok: true});
    const unsubscribeToken = reserved.unsubscribe_token;
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
