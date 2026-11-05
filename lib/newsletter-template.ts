import type { Post } from './blog.ts';
import { absolutize } from './html.ts';
import { emailDocument, emailHeading, escapeHtml, styleContent } from './email-layout.ts';
import { localePath, type Locale } from './i18n.ts';

/** Resend replaces this with each contact's unsubscribe link in broadcasts and adds the List-Unsubscribe headers. */
export const RESEND_UNSUBSCRIBE = '{{{RESEND_UNSUBSCRIBE_URL}}}';
const FOOTER: Record<Locale, {why: string; web: string; unsubscribe: string; from: string}> = {
  'zh-TW': {why: '你收到這封信，是因為你訂閱了人蔘電子報。', web: '在網站上看這期', unsubscribe: '退訂', from: '人蔘 Try Catch'},
  en: {why: 'You are getting this because you subscribed to the Ginseng Try Catch newsletter.', web: 'Read on the web', unsubscribe: 'Unsubscribe', from: 'Ginseng Try Catch'},
};
export { absolutize };
/** The plain-text part is the Markdown source; its site-relative link and image targets need the same treatment. */
export const absolutizeMarkdown = (markdown: string, site: string) => markdown.replace(/\]\(\/(?!\/)/g, `](${site.replace(/\/$/, '')}/`);

export function issueEmail(issue: Post, bodyHtml: string, site: string) {
  const t = FOOTER[issue.locale], web = `${site}${localePath(issue.locale, `/newsletter/${issue.slug}`)}`;
  const html = emailDocument({
    locale: issue.locale, site, title: issue.title, preheader: issue.summary || undefined,
    kicker: issue.locale === 'en' ? 'Newsletter' : '人蔘電子報',
    body: emailHeading(issue.title, issue.summary || undefined) + styleContent(bodyHtml, site, issue.locale),
    footer: [escapeHtml(t.why), `<a href="${escapeHtml(web)}" style="color:#fff4e2;font-weight:700">${escapeHtml(t.web)}</a>&nbsp;·&nbsp;<a href="${RESEND_UNSUBSCRIBE}" style="color:#fff4e2;font-weight:700">${escapeHtml(t.unsubscribe)}</a>`],
  });
  const text = `${issue.title}\n\n${absolutizeMarkdown(issue.body.trim(), site)}\n\n—\n${t.why}\n${t.web}: ${web}\n${t.unsubscribe}: ${RESEND_UNSUBSCRIBE}\n`;
  return {subject: issue.title, previewText: issue.summary || undefined, html, text, name: `${issue.locale}/${issue.slug}`};
}
