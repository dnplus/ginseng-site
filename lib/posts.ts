/// <reference types="vite/client" />
import { Marked } from 'marked';
import { indexPosts } from './blog';

// Bundled into the Worker at build time; there is no filesystem at request time.
const files = import.meta.glob('/content/posts/*/*.md', {query: '?raw', import: 'default', eager: true}) as Record<string, string>;
/** Drafts render in `pnpm dev` only. */
export const posts = indexPosts(files, import.meta.env.DEV);

const attr = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const marked = new Marked({gfm: true, renderer: {
  link({href, title, tokens}) {
    const inner = this.parser.parseInline(tokens);
    const external = /^https?:\/\//.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${attr(href)}"${title ? ` title="${attr(title)}"` : ''}${external}>${inner}</a>`;
  },
  image({href, title, text}) {
    return `<img src="${attr(href)}" alt="${attr(text)}"${title ? ` title="${attr(title)}"` : ''} loading="lazy" decoding="async"/>`;
  },
}});
/** Post bodies are written by the site owner and reviewed in git, so the HTML is trusted. */
export const renderMarkdown = (markdown: string) => marked.parse(markdown, {async: false});
