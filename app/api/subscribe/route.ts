import { env } from 'cloudflare:workers';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n';
import { requestLocale } from '@/lib/messages';
import { CONFIRM_RESEND_MS, CONFIRM_WINDOW_LIMIT, CONFIRM_WINDOW_MS, confirmationEmail, PENDING_RETENTION_MS } from '@/lib/newsletter-email';
import { body, database, failure, FormError, json, rateLimit } from '@/lib/server';
import { PURGE_UNCONFIRMED_SQL } from '@/lib/subscribers';
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
    const now = new Date(), at = now.toISOString(), before = (ms: number) => new Date(now.getTime() - ms).toISOString();
    // Signups that never confirmed do not stay forever. Cleaned up here, like expired rate limits, since there is no
    // scheduled job; a failure must not cost this visitor their signup.
    try { await db.prepare(PURGE_UNCONFIRMED_SQL).bind(before(PENDING_RETENTION_MS)).run(); } catch { console.error('Unconfirmed signup cleanup failed'); }
    const confirmToken = crypto.randomUUID();
    // One statement reserves the send: it only inserts or updates when the address is not active, no confirmation went
    // out within the resend window (?8) and fewer than the limit (?10) went out in the current window (?9), so two
    // overlapping requests cannot both send. The limit counts every email to the address, whether it is pending or
    // unsubscribed: nobody can keep emailing someone by sending the form again and again. The unsubscribe token comes
    // back from the row itself, so a returning address keeps its original link.
    // A brand-new address has nothing in Resend yet, so it starts in sync; an existing row keeps its own sync state.
    const reserved = await db.prepare(`INSERT INTO subscribers (id, email, status, unsubscribe_token, consent_version, created_at, updated_at, locale, source, confirm_token, confirm_sent_at, resend_sync, confirm_sends, confirm_window_at)
      VALUES (?1, ?2, 'pending', ?3, ?4, ?5, ?5, ?6, 'website', ?7, ?5, 'done', 1, ?5)
      ON CONFLICT(email) DO UPDATE SET status = 'pending', consent_version = excluded.consent_version, consent_text = NULL, updated_at = excluded.updated_at, locale = excluded.locale, confirm_token = excluded.confirm_token, confirm_sent_at = excluded.confirm_sent_at,
        confirm_sends = CASE WHEN subscribers.confirm_window_at IS NOT NULL AND subscribers.confirm_window_at > ?9 THEN subscribers.confirm_sends + 1 ELSE 1 END,
        confirm_window_at = CASE WHEN subscribers.confirm_window_at IS NOT NULL AND subscribers.confirm_window_at > ?9 THEN subscribers.confirm_window_at ELSE excluded.confirm_window_at END
      WHERE subscribers.status != 'active'
        AND NOT (subscribers.status = 'pending' AND subscribers.confirm_sent_at IS NOT NULL AND subscribers.confirm_sent_at > ?8)
        AND NOT (subscribers.confirm_window_at IS NOT NULL AND subscribers.confirm_window_at > ?9 AND subscribers.confirm_sends >= ?10)
      RETURNING unsubscribe_token, confirm_token`).bind(crypto.randomUUID(), email, crypto.randomUUID(), CONSENT_VERSION, at, locale, confirmToken, before(CONFIRM_RESEND_MS), before(CONFIRM_WINDOW_MS), CONFIRM_WINDOW_LIMIT).first<{unsubscribe_token: string; confirm_token: string}>();
    if (reserved?.confirm_token !== confirmToken) return json({ok: true});
    const unsubscribeToken = reserved.unsubscribe_token;
    const site = (env.SITE_URL || new URL(request.url).origin).replace(/\/$/, '');
    try {
      await env.NEWSLETTER_EMAIL.send(confirmationEmail(site, locale, email, confirmToken, unsubscribeToken));
    } catch {
      // Let the visitor retry right away instead of waiting out the resend window, and do not count the email that never left.
      await db.prepare('UPDATE subscribers SET confirm_sent_at = NULL, confirm_sends = MAX(confirm_sends - 1, 0) WHERE email = ? AND confirm_token = ?').bind(email, confirmToken).run();
      console.error('Newsletter confirmation email failed');
      throw new FormError('unavailable', 503);
    }
    return json({ok: true});
  } catch (error) { return failure(error, request); }
}
