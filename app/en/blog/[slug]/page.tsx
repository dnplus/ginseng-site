import { notFound } from 'next/navigation';
import { BlogPost } from '../../../components/blog';
import { postMetadata } from '@/lib/post-metadata';
import { posts } from '@/lib/posts';

type Props = {params: Promise<{slug: string}>};
export async function generateMetadata({params}: Props) { const post = posts.find('en', (await params).slug); return post ? postMetadata(post) : {}; }
export default async function Page({params}: Props) {
  const post = posts.find('en', (await params).slug);
  if (!post) notFound();
  return <BlogPost post={post}/>;
}
