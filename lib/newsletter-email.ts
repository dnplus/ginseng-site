import { button, emailDocument, emailHeading, emailParagraph, escapeHtml } from './email-layout.ts';
import { dictionary, localePath, type Locale } from './i18n.ts';

export const NEWSLETTER_SENDER = 'ginseng@dnplus.dev';
const SENDER_NAME: Record<Locale, string> = {'zh-TW': '人蔘 Try Catch', en: 'Ginseng Try Catch'};
/** Confirmation links stay valid this long; after that the visitor subscribes again for a fresh link. */
export const CONFIRM_TTL_MS = 7 * 24 * 3_600_000;
/** A pending address gets at most one confirmation email per window, however often the form is sent. */
export const CONFIRM_RESEND_MS = 10 * 60_000;

export const confirmUrl = (site: string, locale: Locale, token: string) => `${site}${localePath(locale, '/newsletter/confirm')}?token=${token}`;
export const unsubscribeUrl = (site: string, token: string) => `${site}/unsubscribe?token=${token}`;

/**
 * RFC 8058 one-click unsubscribe headers for every newsletter email. Mailbox providers POST
 * `List-Unsubscribe=One-Click` to the HTTPS URL; Gmail and Yahoo require this from bulk senders.
 */
export function listUnsubscribeHeaders(site: string, token: string): Record<string, string> {
  return {'List-Unsubscribe': `<${site}/api/unsubscribe/one-click?token=${token}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'};
}

export function confirmationEmail(site: string, locale: Locale, email: string, confirmToken: string, unsubscribeToken: string) {
  const t = dictionary(locale).newsletter.email, link = confirmUrl(site, locale, confirmToken);
  const text = [t.greeting, '', t.body, '', link, '', t.ignore, '', '—', SENDER_NAME[locale], site].join('\n');
  const html = emailDocument({
    locale, site, title: t.subject, preheader: t.body, kicker: locale === 'en' ? 'Newsletter' : '人蔘電子報',
    body: emailHeading(t.greeting) + emailParagraph(t.body) + button(link, escapeHtml(t.button)) + emailParagraph(t.ignore, true),
    footer: [],
  });
  return {
    from: {email: NEWSLETTER_SENDER, name: SENDER_NAME[locale]}, to: email, subject: t.subject, text, html,
    headers: listUnsubscribeHeaders(site, unsubscribeToken),
  };
}
