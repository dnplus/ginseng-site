import { NewsletterPage } from '../components/newsletter';
import { dictionary } from '@/lib/i18n';
import { pageMetadata } from '@/lib/metadata';

const t = dictionary('zh-TW').newsletter;
export const metadata = pageMetadata('zh-TW', '/newsletter', {title: t.title, description: t.description});
export default function Page() { return <NewsletterPage locale={'zh-TW'}/>; }
