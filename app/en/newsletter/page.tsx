import { NewsletterPage } from '../../components/newsletter';
import { dictionary } from '@/lib/i18n';
import { pageMetadata } from '@/lib/metadata';

const t = dictionary('en').newsletter;
export const metadata = pageMetadata('en', '/newsletter', {title: t.title, description: t.description});
export default function Page() { return <NewsletterPage locale={'en'}/>; }
