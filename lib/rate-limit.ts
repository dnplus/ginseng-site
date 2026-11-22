/**
 * What a per-connection rate limit counts. An IPv6 line is normally handed a whole /64 and can use any address in it,
 * so counting single addresses would let one connection rotate past the limit: every address in a /64 counts as one.
 * IPv4 addresses, including IPv4-mapped IPv6 ones, count individually. Anything that does not parse is counted as
 * given (Cloudflare sets `CF-Connecting-IP`, so that only happens outside production).
 */
export function rateLimitSubject(ip: string | null | undefined): string {
  const address = ip?.trim().toLowerCase();
  if (!address) return 'unknown';
  if (!address.includes(':')) return address;
  const groups = expand(address);
  if (!groups) return address;
  if (groups.slice(0, 5).every(group => group === 0) && groups[5] === 0xffff) return `${groups[6] >> 8}.${groups[6] & 255}.${groups[7] >> 8}.${groups[7] & 255}`;
  return `${groups.slice(0, 4).map(group => group.toString(16)).join(':')}::/64`;
}

/** The eight 16-bit groups of an IPv6 address, or null when it is not one. */
function expand(address: string): number[] | null {
  const halves = address.split('::');
  if (halves.length > 2) return null;
  const parts = halves.map(half => half ? half.split(':') : []);
  // Only the very end of an address may be a dotted quad.
  const end = dottedQuad(parts[parts.length - 1]);
  if (!end) return null;
  parts[parts.length - 1] = end;
  const [head, rest = []] = parts, missing = 8 - head.length - rest.length;
  // `::` stands for at least one group; without it all eight must be written out.
  if (halves.length === 2 ? missing < 1 : missing !== 0) return null;
  const all = [...head, ...Array<string>(missing).fill('0'), ...rest];
  return all.every(group => /^[0-9a-f]{1,4}$/.test(group)) ? all.map(group => parseInt(group, 16)) : null;
}

/** A trailing dotted quad (as in ::ffff:192.0.2.1) written as the two groups it stands for. */
function dottedQuad(groups: string[]): string[] | null {
  const last = groups.at(-1);
  if (!last?.includes('.')) return groups;
  const bytes = last.split('.');
  if (bytes.length !== 4 || !bytes.every(byte => /^\d{1,3}$/.test(byte) && Number(byte) <= 255)) return null;
  const [a, b, c, d] = bytes.map(Number);
  return [...groups.slice(0, -1), ((a << 8) | b).toString(16), ((c << 8) | d).toString(16)];
}
