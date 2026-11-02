import { ConfirmPage } from '../../components/newsletter';
import { dictionary } from '@/lib/i18n';

export const metadata = {title: dictionary('zh-TW').newsletter.confirmTitle, robots: {index: false, follow: false}};
export default async function Page({searchParams}: {searchParams: Promise<{token?: string}>}) {
  const {token} = await searchParams;
  return <ConfirmPage locale={'zh-TW'} token={typeof token === 'string' ? token : ''}/>;
}
