import { Home } from './components/home';
import { pageMetadata } from '@/lib/metadata';

export const dynamic = 'force-dynamic';
export const metadata = pageMetadata('zh-TW', '/');
export default function Page() { return <Home locale="zh-TW"/>; }
