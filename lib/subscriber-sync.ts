import { env } from 'cloudflare:workers';
import { Resend } from 'resend';
import { pushSubscriber, resendReady, type SubscriberRow } from './resend-sync';

export const resendClient = () => resendReady(env) ? new Resend(env.RESEND_API_KEY) : null;

/**
 * Push pending subscriber changes to Resend: one address right after it changes, or a batch from the studio. A row
 * waiting for email confirmation is pushed as unsubscribed: that only updates a contact Resend already has (someone who
 * unsubscribed and is now signing up again must stop getting mail until they confirm) and never creates one, so an
 * unconfirmed address never reaches Resend. Each row costs up to four API calls, so batches stay small.
 */
export async function syncSubscribers(db: D1Database, options: {email?: string; limit?: number} = {}) {
  const client = resendClient();
  if (!client) return {synced: 0, failed: 0, configured: false};
  // Oldest attempt first (never-tried rows lead), so rows that keep failing move to the back instead of blocking the rest.
  const rows = options.email
    ? await db.prepare("SELECT email, status, locale FROM subscribers WHERE email = ? AND resend_sync = 'pending'").bind(options.email).all<SubscriberRow>()
    : await db.prepare("SELECT email, status, locale FROM subscribers WHERE resend_sync = 'pending' ORDER BY resend_synced_at IS NOT NULL, resend_synced_at, updated_at LIMIT ?").bind(options.limit ?? 15).all<SubscriberRow>();
  let synced = 0, failed = 0;
  for (const first of rows.results) {
    // A change can land while a push is in flight (say, an unsubscribe while the studio pushes "active"). The row is
    // marked done only if it still holds the pushed state; otherwise the current state is pushed once more, so the
    // last push to reach Resend always matches D1.
    let row: SubscriberRow | null = first;
    for (let attempt = 0; row && attempt < 2; attempt++) {
      const at = new Date().toISOString();
      try {
        await pushSubscriber(client, env, row);
      } catch (error) {
        failed++;
        await db.prepare('UPDATE subscribers SET resend_synced_at = ? WHERE email = ?').bind(at, row.email).run();
        console.error('Resend sync failed', error instanceof Error ? error.message : 'unknown');
        row = null;
        break;
      }
      const done = await db.prepare("UPDATE subscribers SET resend_sync = 'done', resend_synced_at = ? WHERE email = ? AND status = ? AND locale = ?").bind(at, row.email, row.status, row.locale).run();
      if (done.meta.changes) { synced++; row = null; break; }
      await db.prepare("UPDATE subscribers SET resend_sync = 'pending' WHERE email = ?").bind(first.email).run();
      row = await db.prepare("SELECT email, status, locale FROM subscribers WHERE email = ?").bind(first.email).first<SubscriberRow>();
    }
  }
  return {synced, failed, configured: true};
}

/** For form handlers: never fail the visitor's request because Resend is slow or down. */
export async function syncQuietly(db: D1Database, email: string) {
  try { await syncSubscribers(db, {email}); } catch { console.error('Resend sync skipped'); }
}
