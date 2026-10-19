import { env } from 'cloudflare:workers';
import { database, failure, json } from '@/lib/server';
import { isStudioOwner } from '@/lib/access-auth';
import { csvCell } from '@/lib/validation';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
  if (!await isStudioOwner(request.headers, env)) return json({error: '無權存取。'}, 403);
  const url = new URL(request.url);
  const kind = url.searchParams.get('kind') === 'inquiries' ? 'inquiries' : 'subscribers';
  const result = await database().prepare(kind === 'subscribers' ? "SELECT email, created_at, consent_version, unsubscribe_token FROM subscribers WHERE status = 'active' ORDER BY created_at DESC" : 'SELECT name, email, company, topic, message, created_at FROM inquiries ORDER BY created_at DESC').all<Record<string, string>>();
  const columns = kind === 'subscribers' ? ['email', 'created_at', 'consent_version', 'unsubscribe_url'] : ['name', 'email', 'company', 'topic', 'message', 'created_at'];
  const rows = result.results.map(row => columns.map(column => csvCell(column === 'unsubscribe_url' ? `${url.origin}/unsubscribe?token=${row.unsubscribe_token}` : row[column])).join(','));
  return new Response('\uFEFF' + [columns.join(','), ...rows].join('\r\n'), {headers: {'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="ginseng-${kind}.csv"`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'}});
  } catch(error) { return failure(error); }
}
