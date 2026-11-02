import { PrivacyPage } from '../../components/privacy';
import { pageMetadata } from '@/lib/metadata';
export const metadata = pageMetadata('en', '/privacy', {title: 'Privacy | Ginseng Try Catch', description: 'How Ginseng Try Catch uses newsletter and contact form data.'});
export default function Privacy() { return <PrivacyPage locale="en"/>; }
