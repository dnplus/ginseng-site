import { PrivacyPage } from '../components/privacy';
import { pageMetadata } from '@/lib/metadata';
export const metadata = pageMetadata('zh-TW', '/privacy', {title: '隱私說明｜人蔘 Try Catch', description: '人蔘 Try Catch 如何使用電子報訂閱與合作表單的資料。'});
export default function Privacy() { return <PrivacyPage locale="zh-TW"/>; }
