import { LabPage } from '../components/lab';
import { dictionary } from '@/lib/i18n';
import { pageMetadata } from '@/lib/metadata';

const t = dictionary('zh-TW').lab;
export const metadata = pageMetadata('zh-TW', '/lab', {title: t.title, description: t.description});
export default function Page() { return <LabPage locale="zh-TW"/>; }
