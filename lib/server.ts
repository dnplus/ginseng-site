import { env } from 'cloudflare:workers';
export class FormError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function database() {
  if (!env.DB) throw new FormError('服務暫時無法使用，請稍後再試。', 503);
  return env.DB;
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {status, headers: {'Cache-Control': 'no-store'}});
}
export async function body(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) throw new FormError('請從本站重新送出。', 403);
  if (!request.headers.get('content-type')?.includes('application/json')) throw new FormError('不支援的資料格式。', 415);
  const reader = request.body?.getReader();
  if (!reader) throw new FormError('請填寫資料。');
  let bytes = 0;
  const decoder = new TextDecoder();
  let text = '';
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    bytes += chunk.value.byteLength;
    if (bytes > 16384) { await reader.cancel(); throw new FormError('內容太長，請縮短後再試。', 413); }
    text += decoder.decode(chunk.value, {stream: true});
  }
  text += decoder.decode();
  try {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
    return data as Record<string, unknown>;
  } catch { throw new FormError('資料格式不正確。'); }
}
export async function rateLimit(request: Request, action: string) {
  const db = database();
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const bucket = Math.floor(Date.now() / 3600000);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${action}:${ip}:${bucket}`));
  const key = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  const result = await db.prepare('INSERT INTO rate_limits (key, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count').bind(key, (bucket + 1) * 3600).first<{count: number}>();
  await db.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(Math.floor(Date.now() / 1000)).run();
  if ((result?.count ?? 99) > 12) throw new FormError('送出次數較多，請一小時後再試。', 429);
}
export function failure(error: unknown) {
  if (error instanceof FormError) return json({error: error.message}, error.status);
  console.error('Form request failed');
  return json({error: '暫時無法儲存，請稍後再試。'}, 503);
}
