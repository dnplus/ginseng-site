import { CommunityPage } from '../../components/community';
import { dictionary } from '@/lib/i18n';
import { pageMetadata } from '@/lib/metadata';

const t = dictionary('en').community;
export const metadata = pageMetadata('en', '/community', {title: t.title, description: t.description});
export default function Page() { return <CommunityPage locale="en"/>; }
