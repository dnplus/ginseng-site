import { env } from 'cloudflare:workers';
import { Resend } from 'resend';
import { database, json } from '@/lib/server';

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
  for (const email of emails) {
    // Resend already has this state, so the row is in sync.
    await db.prepare("UPDATE subscribers SET status = 'unsubscribed', confirm_token = NULL, resend_sync = 'done', resend_synced_at = ?, updated_at = ? WHERE email = ? AND status = 'active'").bind(now, now, email.trim().toLowerCase()).run();
  }
  return json({ok: true, applied: emails.length});
}
