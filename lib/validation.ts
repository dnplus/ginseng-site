export const CONSENT_VERSION = '2026-10-07';
export const TOPICS = ['AI 導入 / 技術顧問', '企業內訓 / 分享邀約', '品牌合作 / 內容企劃', '其他有趣的可能'];
export function cleanEmail(value: unknown) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
export function cleanText(value: unknown, min: number, max: number) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length >= min && text.length <= max ? text : null;
}
export function csvCell(value: unknown) {
  let text = String(value ?? '');
  if (/^[\s]*[=+\-@\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
