/**
 * Make site-relative links and images absolute. Feed readers and email clients often have no base URL, so `/blog/x.png`
 * would point nowhere. Protocol-relative (`//host`) and absolute URLs are left alone.
 */
export const absolutize = (html: string, site: string) => html.replace(/(\s(?:href|src)=")\/(?!\/)/g, `$1${site.replace(/\/$/, '')}/`);
