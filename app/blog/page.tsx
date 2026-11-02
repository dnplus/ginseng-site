import { BlogIndex } from '../components/blog';
import { dictionary } from '@/lib/i18n';
import { pageMetadata } from '@/lib/metadata';

const t = dictionary('zh-TW').blog;
export const metadata = pageMetadata('zh-TW', '/blog', {title: t.title, description: t.description});
export default function Page() { return <BlogIndex locale={'zh-TW'}/>; }
