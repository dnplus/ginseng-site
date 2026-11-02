import type { Post } from './blog.ts';
import { absolutize } from './html.ts';
import { localePath, type Locale } from './i18n.ts';

/** Resend replaces this with each contact's unsubscribe link in broadcasts and adds the List-Unsubscribe headers. */
export const RESEND_UNSUBSCRIBE = '{{{RESEND_UNSUBSCRIBE_URL}}}';
const FOOTER: Record<Locale, {why: string; web: string; unsubscribe: string; from: string}> = {
  'zh-TW': {why: '你收到這封信，是因為你訂閱了人蔘電子報。', web: '在網站上看這期', unsubscribe: '退訂', from: '人蔘 Try Catch'},
  en: {why: 'You are getting this because you subscribed to the Ginseng Try Catch newsletter.', web: 'Read on the web', unsubscribe: 'Unsubscribe', from: 'Ginseng Try Catch'},
};
const escape = (text: string) => text.replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character] ?? character));
export { absolutize };
/** The plain-text part is the Markdown source; its site-relative link and image targets need the same treatment. */
export const absolutizeMarkdown = (markdown: string, site: string) => markdown.replace(/\]\(\/(?!\/)/g, `](${site.replace(/\/$/, '')}/`);

export function issueEmail(issue: Post, bodyHtml: string, site: string) {
  const t = FOOTER[issue.locale], web = `${site}${localePath(issue.locale, `/newsletter/${issue.slug}`)}`;
  const html = `<!doctype html><html lang="${issue.locale}"><body style="margin:0;background:#fff4e2">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;font-family:system-ui,-apple-system,'PingFang TC','Noto Sans TC',sans-serif;font-size:17px;line-height:1.8;color:#263f35">
<p style="margin:0 0 8px;font-size:13px;font-weight:800;letter-spacing:.04em">${escape(t.from)}</p>
<h1 style="margin:0 0 24px;font-size:28px;line-height:1.3">${escape(issue.title)}</h1>
${absolutize(bodyHtml, site).replaceAll('<img ', '<img style="max-width:100%;height:auto;border-radius:12px" ')}
<hr style="margin:40px 0 20px;border:0;border-top:2px dashed #d8cfbb">
<p style="font-size:13px;color:#4a5a4f">${escape(t.why)}<br><a href="${escape(web)}" style="color:#263f35">${escape(t.web)}</a> · <a href="${RESEND_UNSUBSCRIBE}" style="color:#263f35">${escape(t.unsubscribe)}</a></p>
</div></body></html>`;
  const text = `${issue.title}\n\n${absolutizeMarkdown(issue.body.trim(), site)}\n\n—\n${t.why}\n${t.web}: ${web}\n${t.unsubscribe}: ${RESEND_UNSUBSCRIBE}\n`;
  return {subject: issue.title, previewText: issue.summary || undefined, html, text, name: `${issue.locale}/${issue.slug}`};
}
