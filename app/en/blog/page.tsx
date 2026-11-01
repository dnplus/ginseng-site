import { BlogIndex } from '../../components/blog';
import { dictionary } from '@/lib/i18n';
import { pageMetadata } from '@/lib/metadata';

const t = dictionary('en').blog;
export const metadata = pageMetadata('en', '/blog', {title: t.title, description: t.description});
export default function Page() { return <BlogIndex locale={'en'}/>; }
