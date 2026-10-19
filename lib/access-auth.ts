import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export interface StudioAccessConfig {
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  STUDIO_OWNER_EMAIL?: string;
}

const keySets = new Map<string, JWTVerifyGetKey>();

export async function isStudioOwner(
  headers: Pick<Headers, 'get'>,
  config: StudioAccessConfig,
  keySet?: JWTVerifyGetKey,
): Promise<boolean> {
  const teamDomain = config.CF_ACCESS_TEAM_DOMAIN?.trim();
  const audience = config.CF_ACCESS_AUD?.trim();
  const ownerEmail = config.STUDIO_OWNER_EMAIL?.trim().toLowerCase();
  const token = headers.get('cf-access-jwt-assertion');
  if (!teamDomain || !audience || !ownerEmail || !token) return false;

  try {
    const issuer = new URL(teamDomain);
    if (
      issuer.protocol !== 'https:' ||
      !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer.hostname) ||
      issuer.username || issuer.password || issuer.port ||
      issuer.pathname !== '/' || issuer.search || issuer.hash
    ) return false;

    if (!keySet) {
      keySet = keySets.get(issuer.origin);
      if (!keySet) {
        keySet = createRemoteJWKSet(new URL('/cdn-cgi/access/certs', issuer));
        keySets.set(issuer.origin, keySet);
      }
    }

    const { payload } = await jwtVerify(token, keySet, {
      issuer: issuer.origin,
      audience,
      algorithms: ['RS256'],
      requiredClaims: ['exp', 'iat', 'sub', 'email'],
    });
    return typeof payload.email === 'string' && payload.email.toLowerCase() === ownerEmail;
  } catch {
    return false;
  }
}
