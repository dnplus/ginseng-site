import { database } from '@/lib/server';
import { studioAction } from '@/lib/studio-action';
import { syncSubscribers } from '@/lib/subscriber-sync';

export function POST(request: Request) {
  return studioAction(request, async () => {
    const db = database();
    const result = await syncSubscribers(db, {limit: 15});
    if (!result.configured) return '尚未設定 Resend（RESEND_API_KEY、RESEND_SEGMENT_ZH_TW、RESEND_SEGMENT_EN）。';
    const left = await db.prepare("SELECT COUNT(*) AS count FROM subscribers WHERE resend_sync = 'pending'").first<{count: number}>();
    return `已同步 ${result.synced} 筆，失敗 ${result.failed} 筆，還有 ${left?.count ?? 0} 筆待同步。`;
  });
}
