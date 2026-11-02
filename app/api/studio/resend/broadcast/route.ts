import { env } from 'cloudflare:workers';
import { isLocale } from '@/lib/i18n';
import { NEWSLETTER_SENDER } from '@/lib/newsletter-email';
import { issueEmail } from '@/lib/newsletter-template';
import { issues, renderMarkdown } from '@/lib/posts';
import { segmentFor } from '@/lib/resend-sync';
import { studioAction } from '@/lib/studio-action';
import { resendClient } from '@/lib/subscriber-sync';

const SENDER_NAME = {'zh-TW': '人蔘 Try Catch', en: 'Ginseng Try Catch'} as const;

/**
 * Turn an archived issue into a Resend broadcast draft for that language's segment. It is never sent from here: send a
 * test and then the broadcast from the Resend dashboard, so one click on this site cannot email everyone.
 */
export function POST(request: Request) {
  return studioAction(request, async form => {
    const locale = String(form.get('locale')), slug = String(form.get('slug'));
    if (!isLocale(locale)) throw new Error('語言不正確');
    const issue = issues.find(locale, slug);
    if (!issue) throw new Error(`找不到電子報 ${locale}/${slug}`);
    const client = resendClient(), segmentId = segmentFor(env, locale);
    if (!client || !segmentId) return '尚未設定 Resend（RESEND_API_KEY、RESEND_SEGMENT_ZH_TW、RESEND_SEGMENT_EN）。';
    const site = (env.SITE_URL || new URL(request.url).origin).replace(/\/$/, '');
    const email = issueEmail(issue, renderMarkdown(issue.body), site);
    const result = await client.broadcasts.create({segmentId, from: `${SENDER_NAME[locale]} <${NEWSLETTER_SENDER}>`, ...email, send: false});
    if (result.error) throw new Error(result.error.message);
    return `已在 Resend 建立草稿「${issue.title}」（${result.data.id}）。請到 Resend 寄測試信，確認後再發送。`;
  });
}
