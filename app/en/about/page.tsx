import { AboutPage } from '../../components/about';
import { dictionary } from '@/lib/i18n';
import { pageMetadata } from '@/lib/metadata';

const t = dictionary('en').about;
export const metadata = pageMetadata('en', '/about', {title: t.title, description: t.description});
export default function Page() { return <AboutPage locale="en"/>; }
