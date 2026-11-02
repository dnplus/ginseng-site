/**
 * Server-to-server calls from Ginseng Try Catch products (PA Cafe first) are signed with a shared secret:
 *   X-Ginseng-Timestamp: unix seconds
 *   X-Ginseng-Signature: hex HMAC-SHA256 of `${timestamp}.${raw body}`
 * Requests older or newer than five minutes are refused, so a captured request cannot be replayed later.
 */
export const PARTNER_TOLERANCE_SECONDS = 300;
const encoder = new TextEncoder();
const hex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');

export async function partnerSignature(secret: string, timestamp: string, body: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${body}`)));
}

export async function verifyPartner(secret: string | undefined, headers: Headers, body: string, now = Date.now()) {
  const timestamp = headers.get('x-ginseng-timestamp'), signature = headers.get('x-ginseng-signature');
  if (!secret || !timestamp || !signature || !/^\d{1,12}$/.test(timestamp) || !/^[0-9a-f]{64}$/.test(signature)) return false;
  if (Math.abs(now / 1000 - Number(timestamp)) > PARTNER_TOLERANCE_SECONDS) return false;
  const expected = await partnerSignature(secret, timestamp, body);
  // Constant-time comparison.
  let difference = 0;
  for (let index = 0; index < expected.length; index++) difference |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  return difference === 0;
}

/** Product languages (PA Cafe: en, zh-TW, zh-CN, ja, ko) mapped to the newsletter's two editions. */
export const newsletterLocale = (language: unknown) => typeof language === 'string' && /^zh\b/i.test(language) ? 'zh-TW' as const : 'en' as const;
