import { AboutPage } from '../components/about';
import { dictionary } from '@/lib/i18n';
import { pageMetadata } from '@/lib/metadata';

const t = dictionary('zh-TW').about;
export const metadata = pageMetadata('zh-TW', '/about', {title: t.title, description: t.description});
export default function Page() { return <AboutPage locale="zh-TW"/>; }
