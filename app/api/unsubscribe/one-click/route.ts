import { database, json } from '@/lib/server';
import { UNSUBSCRIBE_SQL } from '@/lib/subscribers';
import { syncQuietly } from '@/lib/subscriber-sync';

const tokenOf = (request: Request) => { const token = new URL(request.url).searchParams.get('token'); return token && /^[0-9a-f-]{36}$/.test(token) ? token : null; };

/**
 * RFC 8058 one-click unsubscribe, the target of the List-Unsubscribe header. Mailbox providers POST here from their own
 * servers, so there is no Origin or JSON body; the unguessable token in the URL is the authorization.
 */
export async function POST(request: Request) {
  const token = tokenOf(request);
  if (!token) return json({error: 'invalid token'}, 400);
  try {
    const db = database();
    const row = await db.prepare(UNSUBSCRIBE_SQL).bind(new Date().toISOString(), token).first<{email: string}>();
    if (!row) return json({error: 'unknown token'}, 404);
    await syncQuietly(db, row.email);
    return json({ok: true});
  } catch {
    console.error('One-click unsubscribe failed');
    return json({error: 'unavailable'}, 503);
  }
}

/** Someone opened the header link in a browser: show the normal confirm-to-unsubscribe page. */
export function GET(request: Request) {
  const token = tokenOf(request);
  return Response.redirect(new URL(token ? `/unsubscribe?token=${token}` : '/unsubscribe', request.url).toString(), 303);
}
