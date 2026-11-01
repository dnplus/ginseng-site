import { env } from 'cloudflare:workers';
import { Resend } from 'resend';
import { pushSubscriber, resendReady, type SubscriberRow } from './resend-sync';

export const resendClient = () => resendReady(env) ? new Resend(env.RESEND_API_KEY) : null;

/**
 * Push pending subscriber changes to Resend: one address right after it changes, or a batch from the studio. Rows still
 * waiting for email confirmation are skipped; Resend only ever sees confirmed or unsubscribed addresses. Each row costs up
 * to three API calls, so batches stay small enough for one Worker request.
 */
export async function syncSubscribers(db: D1Database, options: {email?: string; limit?: number} = {}) {
  const client = resendClient();
  if (!client) return {synced: 0, failed: 0, configured: false};
  const rows = options.email
    ? await db.prepare("SELECT email, status, locale FROM subscribers WHERE email = ? AND resend_sync = 'pending' AND status != 'pending'").bind(options.email).all<SubscriberRow>()
    : await db.prepare("SELECT email, status, locale FROM subscribers WHERE resend_sync = 'pending' AND status != 'pending' ORDER BY updated_at LIMIT ?").bind(options.limit ?? 15).all<SubscriberRow>();
  let synced = 0, failed = 0;
  for (const row of rows.results) {
    try {
      await pushSubscriber(client, env, row);
      // Only if nothing changed meanwhile; a newer change keeps the row pending for the next push.
      await db.prepare("UPDATE subscribers SET resend_sync = 'done', resend_synced_at = ? WHERE email = ? AND status = ? AND resend_sync = 'pending'").bind(new Date().toISOString(), row.email, row.status).run();
      synced++;
    } catch (error) {
      failed++;
      console.error('Resend sync failed', error instanceof Error ? error.message : 'unknown');
    }
  }
  return {synced, failed, configured: true};
}

/** For form handlers: never fail the visitor's request because Resend is slow or down. */
export async function syncQuietly(db: D1Database, email: string) {
  try { await syncSubscribers(db, {email}); } catch { console.error('Resend sync skipped'); }
}
