import { ConfirmPage } from '../../../components/newsletter';
import { dictionary } from '@/lib/i18n';

export const metadata = {title: dictionary('en').newsletter.confirmTitle, robots: {index: false, follow: false}};
export default async function Page({searchParams}: {searchParams: Promise<{token?: string}>}) {
  const {token} = await searchParams;
  return <ConfirmPage locale={'en'} token={typeof token === 'string' ? token : ''}/>;
}
