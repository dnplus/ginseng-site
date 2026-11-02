import { feed } from '@/lib/feeds';
export function GET(request: Request) { return feed('zh-TW', request); }
