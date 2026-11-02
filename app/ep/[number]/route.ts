import { postPath } from '@/lib/blog';
import { LEGACY_EPISODE_ARTICLES } from '@/lib/episodes';
import { localePath } from '@/lib/i18n';
import { posts } from '@/lib/posts';

/**
 * Stable short link for an episode's article, for video QR codes and YouTube descriptions: /ep/87, /ep/087, /ep/EP087.
 * Points at the article on this site when it exists, else the old Notion page, else the article list. Temporary
 * redirects, so moving an article later only changes where the same short link goes.
 */
export async function GET(request: Request, {params}: {params: Promise<{number: string}>}) {
  const match = /^(?:ep)?0*(\d{1,4})$/i.exec((await params).number);
  const number = match ? Number(match[1]) : null;
  const post = number ? posts.episode(number) : null;
  const target = post ? localePath(post.locale, postPath(post)) : number && LEGACY_EPISODE_ARTICLES[number] ? LEGACY_EPISODE_ARTICLES[number] : '/blog';
  return new Response(null, {status: 302, headers: {Location: new URL(target, request.url).toString(), 'Cache-Control': 'public, max-age=300'}});
}
