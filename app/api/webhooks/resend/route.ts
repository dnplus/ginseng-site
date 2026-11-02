import { env } from 'cloudflare:workers';
import { Resend } from 'resend';
import { database, json } from '@/lib/server';
import { syncQuietly } from '@/lib/subscriber-sync';

/**
 * Resend → D1: a contact who unsubscribes through Resend's link, or marks a broadcast as spam, stops getting mail here
 * too. Configure the webhook in Resend for `contact.updated` and `email.complained`, pointing at this path, and store its
 * signing secret as RESEND_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  if (!env.RESEND_API_KEY || !env.RESEND_WEBHOOK_SECRET) return json({error: 'not configured'}, 503);
  const payload = await request.text();
  const id = request.headers.get('svix-id') ?? request.headers.get('webhook-id'), timestamp = request.headers.get('svix-timestamp') ?? request.headers.get('webhook-timestamp'), signature = request.headers.get('svix-signature') ?? request.headers.get('webhook-signature');
  if (!id || !timestamp || !signature) return json({error: 'invalid signature'}, 403);
  let event;
  try { event = new Resend(env.RESEND_API_KEY).webhooks.verify({payload, headers: {id, timestamp, signature}, webhookSecret: env.RESEND_WEBHOOK_SECRET}); }
  catch { return json({error: 'invalid signature'}, 403); }
  const emails = event.type === 'contact.updated' && event.data.unsubscribed ? [event.data.email]
    : event.type === 'email.complained' ? event.data.to : [];
  const db = database(), now = new Date().toISOString();
  // Events can arrive late or be replayed. One older than the row's last change (say, an unsubscribe from before the
  // person confirmed again on the site) must not undo that change; the row is queued for a push instead, so Resend
  // gets the current state back.
  const happened = Date.parse(event.created_at);
  const eventTime = Number.isNaN(happened) ? now : new Date(happened).toISOString();
  let applied = 0;
  for (const raw of emails) {
    const email = raw.trim().toLowerCase();
    // Queued rather than marked done: a push of the older 'active' state may have reached Resend after this event and
    // resubscribed the contact, so the unsubscribe is pushed back once more.
    const result = await db.prepare("UPDATE subscribers SET status = 'unsubscribed', confirm_token = NULL, resend_sync = 'pending', updated_at = ? WHERE email = ? AND status = 'active' AND updated_at <= ?").bind(now, email, eventTime).run();
    if (result.meta.changes) applied++;
    else await db.prepare("UPDATE subscribers SET resend_sync = 'pending' WHERE email = ? AND status = 'active' AND updated_at > ?").bind(email, eventTime).run();
    await syncQuietly(db, email);
  }
  return json({ok: true, applied});
}
