import { env } from 'cloudflare:workers';
import { DEFAULT_LOCALE, type Locale } from './i18n';
import { message, requestLocale, type MessageKey } from './messages';
export class FormError extends Error {
  constructor(public key: MessageKey, public status = 400) { super(key); }
}
export function database() {
  if (!env.DB) throw new FormError('unavailable', 503);
  return env.DB;
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {status, headers: {'Cache-Control': 'no-store'}});
}
export async function body(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) throw new FormError('wrongOrigin', 403);
  if (!request.headers.get('content-type')?.includes('application/json')) throw new FormError('badContentType', 415);
  const reader = request.body?.getReader();
  if (!reader) throw new FormError('emptyBody');
  let bytes = 0;
  const decoder = new TextDecoder();
  let text = '';
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    bytes += chunk.value.byteLength;
    if (bytes > 16384) { await reader.cancel(); throw new FormError('tooLong', 413); }
    text += decoder.decode(chunk.value, {stream: true});
  }
  text += decoder.decode();
  try {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
    return data as Record<string, unknown>;
  } catch { throw new FormError('badJson'); }
}
export async function rateLimit(request: Request, action: string) {
  const db = database();
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const bucket = Math.floor(Date.now() / 3600000);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${action}:${ip}:${bucket}`));
  const key = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  const result = await db.prepare('INSERT INTO rate_limits (key, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count').bind(key, (bucket + 1) * 3600).first<{count: number}>();
  await db.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(Math.floor(Date.now() / 1000)).run();
  if ((result?.count ?? 99) > 12) throw new FormError('rateLimited', 429);
}
/** Error response in the language the form asked for (`X-Site-Locale`). */
export function failure(error: unknown, request?: Request) {
  const locale: Locale = request ? requestLocale(request) : DEFAULT_LOCALE;
  if (error instanceof FormError) return json({error: message(error.key, locale)}, error.status);
  console.error('Form request failed');
  return json({error: message('saveFailed', locale)}, 503);
}
