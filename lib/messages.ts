import { DEFAULT_LOCALE, isLocale, type Locale } from './i18n.ts';

/** API error and status messages, per language. Forms send `X-Site-Locale`; anything else gets the default language. */
const MESSAGES = {
  unavailable: {'zh-TW': '服務暫時無法使用，請稍後再試。', en: 'The service is temporarily unavailable. Please try again later.'},
  wrongOrigin: {'zh-TW': '請從本站重新送出。', en: 'Please submit the form from this site.'},
  badContentType: {'zh-TW': '不支援的資料格式。', en: 'Unsupported data format.'},
  emptyBody: {'zh-TW': '請填寫資料。', en: 'Please fill in the form.'},
  tooLong: {'zh-TW': '內容太長，請縮短後再試。', en: 'That is too long. Please shorten it and try again.'},
  badJson: {'zh-TW': '資料格式不正確。', en: 'The data is not in the expected format.'},
  rateLimited: {'zh-TW': '送出次數較多，請一小時後再試。', en: 'Too many attempts. Please try again in an hour.'},
  saveFailed: {'zh-TW': '暫時無法儲存，請稍後再試。', en: 'Could not save right now. Please try again later.'},
  invalidEmail: {'zh-TW': '請填寫有效的 Email。', en: 'Please enter a valid email address.'},
  subscribeConsent: {'zh-TW': '請先同意訂閱與資料使用說明。', en: 'Please agree to the newsletter and privacy notice first.'},
  contactIncomplete: {'zh-TW': '請完整填寫姓名、Email、合作類型，以及至少 10 字的需求。', en: 'Please fill in your name, email, topic and a message of at least 10 characters.'},
  contactConsent: {'zh-TW': '請先同意聯繫與資料使用說明。', en: 'Please agree to the privacy notice first.'},
  badUnsubscribeLink: {'zh-TW': '退訂連結不完整，請使用信件中的連結。', en: 'The unsubscribe link is incomplete. Please use the link from the email.'},
  unknownSubscription: {'zh-TW': '找不到這筆訂閱，請確認退訂連結。', en: 'No subscription matches this link. Please check the unsubscribe link.'},
  badConfirmLink: {'zh-TW': '確認連結不完整，請使用確認信中的連結。', en: 'The confirmation link is incomplete. Please use the link from the email.'},
  expiredConfirmLink: {'zh-TW': '確認連結已失效，請重新訂閱一次，我們會寄新的確認信。', en: 'This confirmation link has expired. Subscribe again and we will send a new one.'},
} satisfies Record<string, Record<Locale, string>>;

export type MessageKey = keyof typeof MESSAGES;
export const message = (key: MessageKey, locale: Locale = DEFAULT_LOCALE) => MESSAGES[key][locale];
export const LOCALE_REQUEST_HEADER = 'x-site-locale';
export function requestLocale(request: Request): Locale {
  const value = request.headers.get(LOCALE_REQUEST_HEADER);
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
