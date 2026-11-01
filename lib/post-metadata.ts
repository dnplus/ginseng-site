import type { Metadata } from 'next';
import { postPath, type Post } from './blog';
import { BRAND } from './site';
import { pageMetadata } from './metadata';
import { posts } from './posts';
import { thumbnail } from './youtube';

export function postMetadata(post: Post): Metadata {
  const brand = post.locale === 'en' ? BRAND.en : BRAND.zh;
  const separator = post.locale === 'en' ? ' | ' : '｜';
  return {
    ...pageMetadata(post.locale, postPath(post), {
      title: `${post.title}${separator}${brand}`, description: post.summary || undefined, ogType: 'article',
      available: posts.translations(post).map(each => each.locale), image: post.youtube ? thumbnail(post.youtube) : undefined,
    }),
  };
}
