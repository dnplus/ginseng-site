#!/usr/bin/env node
// Move one published Notion article into content/posts. Reads the page as Markdown with the Notion CLI
// (`ntn pages get <id>`, run where `ntn whoami` is logged in) or from a saved file, downloads every image before the
// signed Notion URLs expire, stores them under public/blog/<slug>/ and rewrites the links.
//
//   node scripts/import-notion.mjs <page-id-or-url> --slug ep082 --date 2026-10-25 [--episode 82] [--youtube <id>] [--locale zh-TW] [--file page.md] [--force]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const {values, positionals} = parseArgs({allowPositionals: true, options: {
  slug: {type: 'string'}, date: {type: 'string'}, episode: {type: 'string'}, youtube: {type: 'string'},
  locale: {type: 'string', default: 'zh-TW'}, file: {type: 'string'}, title: {type: 'string'}, summary: {type: 'string'}, force: {type: 'boolean'},
}});
const [page] = positionals;
if (!values.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) fail('--slug is required: lowercase letters, digits and dashes');
if (!values.date || !/^\d{4}-\d{2}-\d{2}$/.test(values.date)) fail('--date YYYY-MM-DD is required (the original publish date)');
if (!page && !values.file) fail('Give a Notion page id or URL, or --file with saved Markdown');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'content/posts', values.locale, `${values.slug}.md`);
if (existsSync(out) && !values.force) fail(`${path.relative(root, out)} exists; pass --force to overwrite`);

// A Notion URL ends in the 32-hex page id.
const pageId = page ? (/([0-9a-f]{32})(?:[?#].*)?$/i.exec(page.replaceAll('-', ''))?.[1] ?? page) : null;
let markdown = values.file ? readFileSync(values.file, 'utf8') : execFileSync('ntn', ['pages', 'get', pageId], {encoding: 'utf8', maxBuffer: 32 * 1024 * 1024});

// Drop a front matter block the CLI may print, then take the first H1 as the title.
markdown = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
let title = values.title;
markdown = markdown.replace(/^\s*# (.+)\r?\n/, (_, heading) => { title ??= heading.trim(); return ''; });
if (!title) fail('No "# Title" line found; pass --title');

const assets = path.join(root, 'public/blog', values.slug);
let count = 0;
const images = [...markdown.matchAll(/!\[([^\]]*)\]\((\S+?)(?:\s+"[^"]*")?\)/g)];
for (const [whole, alt, url] of images) {
  if (!/^https?:\/\//.test(url)) continue;
  const response = await fetch(url);
  if (!response.ok) fail(`Image download failed (${response.status}): ${url}\nSigned Notion URLs expire; run the import again.`);
  const type = response.headers.get('content-type') ?? '';
  const ext = {'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'image/svg+xml': 'svg'}[type.split(';')[0]] ?? (path.extname(new URL(url).pathname).slice(1) || 'png');
  const name = `${String(++count).padStart(2, '0')}.${ext}`;
  mkdirSync(assets, {recursive: true});
  writeFileSync(path.join(assets, name), Buffer.from(await response.arrayBuffer()));
  markdown = markdown.replace(whole, `![${alt}](/blog/${values.slug}/${name})`);
}

const quote = text => JSON.stringify(text);
const notionUrl = page && /^https?:\/\//.test(page) ? page : null;
const front = [
  '---', `title: ${quote(title)}`, `date: ${values.date}`,
  ...(values.summary ? [`summary: ${quote(values.summary)}`] : []),
  ...(values.episode ? [`episode: ${Number(values.episode)}`] : []),
  ...(values.youtube ? [`youtube: ${values.youtube}`] : []),
  ...(notionUrl ? [`legacyUrl: ${notionUrl}`] : []),
  '---', '',
];
mkdirSync(path.dirname(out), {recursive: true});
writeFileSync(out, front.join('\n') + markdown.trim() + '\n');
console.log(`Wrote ${path.relative(root, out)} with ${count} image(s). Add a summary and tags, then check it with pnpm dev.`);

function fail(message) { console.error(message); process.exit(1); }
