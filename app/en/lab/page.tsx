import { LabPage } from '../../components/lab';
import { dictionary } from '@/lib/i18n';
import { pageMetadata } from '@/lib/metadata';

const t = dictionary('en').lab;
export const metadata = pageMetadata('en', '/lab', {title: t.title, description: t.description});
export default function Page() { return <LabPage locale="en"/>; }
