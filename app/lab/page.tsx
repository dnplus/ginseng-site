import { LabPage } from '../components/lab';
import { dictionary } from '@/lib/i18n';
import { LAB_OG_IMAGE, pageMetadata } from '@/lib/metadata';

const t = dictionary('zh-TW').lab;
export const metadata = pageMetadata('zh-TW', '/lab', {title: t.title, description: t.description, image: LAB_OG_IMAGE});
export default function Page() { return <LabPage locale="zh-TW"/>; }
