import { env } from 'cloudflare:workers';
import { isStudioOwner } from './access-auth';

/** Studio buttons are plain HTML form posts: owner-only, same-origin, and they land back on /studio with a notice. */
export async function studioAction(request: Request, run: (form: FormData) => Promise<string>) {
  const back = (notice: string) => new Response(null, {status: 303, headers: {Location: `/studio?notice=${encodeURIComponent(notice)}`, 'Cache-Control': 'no-store'}});
  if (!await isStudioOwner(request.headers, env)) return Response.json({error: '無權存取。'}, {status: 403, headers: {'Cache-Control': 'no-store'}});
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({error: '請從工作站操作。'}, {status: 403, headers: {'Cache-Control': 'no-store'}});
  try { return back(await run(await request.formData())); }
  catch (error) { console.error('Studio action failed'); return back(`失敗：${error instanceof Error ? error.message : '未知錯誤'}`); }
}
