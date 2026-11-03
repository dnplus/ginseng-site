import { absolutize } from './html.ts';
import { localePath, type Locale } from './i18n.ts';
import { PA_CAFE_URL, socials } from './site.ts';

/**
 * The shared email look: the site's cafe identity (forest green, cream, peach, butter plaque) rebuilt for mail clients.
 * Mail clients ignore most CSS, so the layout is tables with inline styles; the <style> block only adds what clients that
 * support it can use (dark mode, narrow screens). Everything still reads correctly without it.
 */
const C = {ink: '#263f35', deep: '#142a22', cream: '#fff4e2', paper: '#fffdf5', band: '#9fd49a', peach: '#f6a77c', butter: '#f7d774', muted: '#4a5a4f', line: '#d8cfbb', tint: '#e9f0de'};
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang TC','Noto Sans TC','Microsoft JhengHei',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character] ?? character));
/** Inverse of `escapeHtml` for text that Markdown already escaped, so a second pass does not turn `&amp;` into `&amp;amp;`. */
const unescapeHtml = (text: string) => text.replace(/&(?:amp|lt|gt|quot|#39);/g, entity => ({'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'"}[entity] ?? entity));

const TEXT: Record<Locale, {plaque: string; home: string; lab: string; community: string; watch: string; follow: string}> = {
  'zh-TW': {plaque: '<b style="font-size:16px">人蔘</b>&nbsp;TRY CATCH', home: 'ginseng.dnplus.dev', lab: '實驗室', community: '社群', watch: '▶&nbsp;看這集影片', follow: '追蹤人蔘'},
  en: {plaque: '<b style="font-size:16px">Ginseng</b>&nbsp;TRY CATCH', home: 'ginseng.dnplus.dev', lab: 'The Lab', community: 'Community', watch: '▶&nbsp;Watch the video', follow: 'Follow Ginseng'},
};

const STYLE = `
:root{color-scheme:light dark;supported-color-schemes:light dark}
body{margin:0;padding:0;-webkit-text-size-adjust:100%}
a{text-decoration-thickness:1px}
@media (max-width:620px){.px{padding-left:20px!important;padding-right:20px!important}.title{font-size:24px!important}.hide-sm{display:none!important}}
@media (prefers-color-scheme:dark){
.bg{background:${C.deep}!important}
.card{background:#1c3329!important;border-color:${C.band}!important}
.card h1,.card h3,.card p,.card li,.card td,.card strong{color:${C.cream}!important}
.card a{color:${C.band}!important}
.card a.btn{color:${C.ink}!important}
.card blockquote{background:${C.deep}!important}
.card code{background:${C.deep}!important;color:${C.band}!important}
.card .lead{color:#c9d8c6!important}
.card .vcap{background:${C.deep}!important}
}`;

/** A button that renders in Outlook too (a padded table cell, not a styled link alone). */
export function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px"><tr><td style="border:2px solid ${C.ink};border-radius:12px;background:${C.peach};mso-padding-alt:12px 24px"><a class="btn" href="${escapeHtml(href)}" style="display:inline-block;padding:12px 24px;font-family:${FONT};font-size:16px;font-weight:800;line-height:1.2;color:${C.ink};text-decoration:none">${label}</a></td></tr></table>`;
}

const youtubeId = (url: string) => /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?(?:[^"]*&)?v=|youtu\.be\/)([\w-]{11})/.exec(url)?.[1] ?? null;

/** A paragraph holding only a YouTube link becomes a thumbnail card with a watch button. */
function videoCard(id: string, url: string, caption: string | null, locale: Locale) {
  const label = caption ? escapeHtml(caption) : '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 24px;border:2px solid ${C.ink};border-radius:16px;border-collapse:separate;overflow:hidden"><tr><td style="padding:0">`
    + `<a href="${escapeHtml(url)}" style="display:block"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" width="536" alt="${label || 'YouTube'}" style="display:block;width:100%;max-width:100%;height:auto;border:0;border-radius:14px 14px 0 0"></a></td></tr>`
    + `<tr><td class="vcap" style="padding:14px 18px;background:${C.cream};border-radius:0 0 14px 14px">${label ? `<p style="margin:0 0 6px;font-family:${FONT};font-size:16px;font-weight:800;line-height:1.5;color:${C.ink}">${label}</p>` : ''}`
    + `<a href="${escapeHtml(url)}" style="font-family:${FONT};font-size:15px;font-weight:800;color:${C.ink};text-decoration:none">${TEXT[locale].watch}</a></td></tr></table>`;
}

/**
 * Inline the cafe styles into Markdown-rendered HTML for email: sticker headings, green links, peach quote bar, rounded
 * images, video cards. Tags that already carry a style (the video card) are left alone.
 */
export function styleContent(html: string, site: string, locale: Locale) {
  let out = absolutize(html, site);
  out = out.replace(/<p>\s*<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/p>/g, (whole, url: string, inner: string) => {
    const id = youtubeId(url.replaceAll('&amp;', '&'));
    if (!id) return whole;
    const caption = unescapeHtml(inner.replace(/<[^>]+>/g, '').trim());
    return videoCard(id, url.replaceAll('&amp;', '&'), caption && !/^https?:\/\//.test(caption) ? caption : null, locale);
  });
  const p = `margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.85;color:${C.ink}`;
  const rules: [RegExp, string][] = [
    [/<h2>/g, `<h2 style="margin:36px 0 16px;font-family:${FONT};font-size:15px;line-height:1.2"><span style="display:inline-block;padding:7px 14px;border:2px solid ${C.ink};border-radius:8px;background:${C.band};color:${C.ink};font-weight:900">`],
    [/<\/h2>/g, '</span></h2>'],
    [/<h3>/g, `<h3 style="margin:28px 0 10px;font-family:${FONT};font-size:19px;line-height:1.4;font-weight:800;color:${C.ink}">`],
    [/<p>/g, `<p style="${p}">`],
    [/<ul>/g, `<ul style="margin:0 0 16px;padding-left:22px;font-family:${FONT};font-size:16px;line-height:1.8;color:${C.ink}">`],
    [/<ol>/g, `<ol style="margin:0 0 16px;padding-left:22px;font-family:${FONT};font-size:16px;line-height:1.8;color:${C.ink}">`],
    [/<li>/g, `<li style="margin:0 0 6px;color:${C.ink}">`],
    [/<blockquote>/g, `<blockquote style="margin:20px 0;padding:14px 18px;border-left:4px solid ${C.peach};border-radius:0 12px 12px 0;background:${C.cream};color:${C.muted}">`],
    [/<pre><code[^>]*>/g, `<pre style="margin:0 0 16px;padding:16px 18px;border-radius:12px;background:${C.ink};color:${C.cream};font-family:${MONO};font-size:14px;line-height:1.6;white-space:pre-wrap;word-break:break-word"><code style="font-family:${MONO};color:${C.cream}">`],
    [/<code>/g, `<code style="padding:1px 6px;border-radius:6px;background:${C.tint};font-family:${MONO};font-size:14px;color:${C.ink}">`],
    [/<hr\s*\/?>/g, `<hr style="margin:28px 0;border:0;border-top:2px dashed ${C.line}">`],
    [/<strong>/g, `<strong style="font-weight:800;color:${C.ink}">`],
    [/<a\s(?![^>]*\bstyle=)/g, `<a style="color:${C.ink};font-weight:700;text-decoration:underline;text-decoration-color:${C.band};text-underline-offset:3px" `],
    [/<img\s(?![^>]*\bstyle=)/g, `<img style="display:block;max-width:100%;height:auto;margin:8px 0 16px;border:2px solid ${C.ink};border-radius:12px" `],
  ];
  for (const [pattern, replacement] of rules) out = out.replace(pattern, replacement);
  // A quote's last paragraph needs no gap under it.
  return out.replace(/<p style="([^"]*)">((?:(?!<\/?p\b)[\s\S])*)<\/p>(\s*)<\/blockquote>/g, (_, style: string, inner: string, gap: string) => `<p style="${style.replace('margin:0 0 16px', 'margin:0')}">${inner}</p>${gap}</blockquote>`);
}

type Shell = {
  locale: Locale; site: string; title: string;
  /** Inbox preview line next to the subject; hidden in the body. */
  preheader?: string;
  /** Small label in the header band, e.g. "電子報". */
  kicker?: string;
  /** Already-styled body HTML. */
  body: string;
  /** Footer lines (HTML, already escaped), e.g. why you got this, web version, unsubscribe. */
  footer: string[];
};

export function emailDocument({locale, site, title, preheader, kicker, body, footer}: Shell) {
  const t = TEXT[locale], home = `${site}${localePath(locale, '/')}`;
  const link = (href: string, label: string) => `<a href="${escapeHtml(href)}" style="color:${C.cream};font-weight:700;text-decoration:underline;text-decoration-color:${C.band}">${label}</a>`;
  const sep = `<span style="color:${C.band}">&nbsp;·&nbsp;</span>`;
  const socialRow = socials(locale).map(each => link(each.url, escapeHtml(each.name))).join(sep);
  const productRow = [link(PA_CAFE_URL, 'PA Cafe'), link(`${site}${localePath(locale, '/lab')}`, escapeHtml(t.lab)), link(`${site}${localePath(locale, '/community')}`, escapeHtml(t.community))].join(sep);
  const htmlLang = locale === 'en' ? 'en' : 'zh-Hant-TW';
  return `<!doctype html>
<html lang="${htmlLang}" xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><meta name="x-apple-disable-message-reformatting"><title>${escapeHtml(title)}</title><style>${STYLE}</style></head>
<body class="bg" style="margin:0;padding:0;background:${C.cream}">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all">${escapeHtml(preheader)}${'&#8204;&nbsp;'.repeat(40)}</div>` : ''}
<table role="presentation" class="bg" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.cream}"><tr><td align="center" style="padding:28px 12px 40px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border-collapse:separate">
<tr><td class="px" style="padding:18px 28px;background:${C.ink};border:2px solid ${C.deep};border-bottom:0;border-radius:20px 20px 0 0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td width="60" style="width:60px;padding-right:14px;vertical-align:middle"><a href="${escapeHtml(home)}"><img src="${site}/assets/email/ginseng-avatar.png" width="56" height="56" alt="" style="display:block;width:56px;height:56px;border:2px solid ${C.deep};border-radius:50%;background:${C.peach}"></a></td>
    <td style="vertical-align:middle"><a href="${escapeHtml(home)}" style="display:inline-block;padding:6px 12px;border:2px solid ${C.deep};border-radius:10px;background:${C.butter};font-family:${FONT};font-size:13px;font-weight:900;letter-spacing:.04em;line-height:1.3;color:${C.ink};text-decoration:none">${t.plaque}</a></td>
    ${kicker ? `<td class="hide-sm" align="right" style="vertical-align:middle;font-family:${FONT};font-size:13px;font-weight:800;color:${C.band}">${escapeHtml(kicker)}</td>` : ''}
  </tr></table>
</td></tr>
<tr><td class="card px" style="padding:32px 32px 20px;background:${C.paper};border:2px solid ${C.ink};border-top:0;border-bottom:0">
${body}
</td></tr>
<tr><td class="px" style="padding:22px 28px 24px;background:${C.ink};border:2px solid ${C.deep};border-top:0;border-radius:0 0 20px 20px;font-family:${FONT};font-size:13px;line-height:1.8;color:${C.cream}">
  <p style="margin:0 0 4px;font-weight:800;color:${C.band}">${escapeHtml(t.follow)}</p>
  <p style="margin:0 0 6px">${socialRow}</p>
  <p style="margin:0 0 14px">${productRow}</p>
  ${footer.map(line => `<p style="margin:0 0 4px;color:#c9d8c6">${line}</p>`).join('')}
  <p style="margin:10px 0 0">${link(home, escapeHtml(t.home))}</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

/** Heading and lead paragraph at the top of the card. */
export function emailHeading(title: string, lead?: string) {
  return `<h1 class="title" style="margin:0 0 12px;font-family:${FONT};font-size:28px;line-height:1.3;font-weight:900;color:${C.ink}">${escapeHtml(title)}</h1>`
    + (lead ? `<p class="lead" style="margin:0 0 24px;font-family:${FONT};font-size:17px;line-height:1.7;color:${C.muted}">${escapeHtml(lead)}</p>` : '<div style="height:12px;line-height:12px">&nbsp;</div>');
}

export const emailParagraph = (text: string, small = false) => `<p style="margin:0 0 16px;font-family:${FONT};font-size:${small ? 14 : 16}px;line-height:1.8;color:${small ? C.muted : C.ink}">${escapeHtml(text)}</p>`;
export { C as EMAIL_COLORS };
