#!/usr/bin/env node
// Draft a blog post from an agentic-remotion-studio episode: scene titles become headings, narration becomes
// paragraphs, sources become the reference list. The result is a draft (`draft: true`) to edit before publishing.
//
//   node --experimental-strip-types scripts/episode-to-post.mjs <path/to/epNNN/episode.ts> [--youtube <id>] [--date YYYY-MM-DD] [--force]
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const {values, positionals} = parseArgs({allowPositionals: true, options: {youtube: {type: 'string'}, date: {type: 'string'}, force: {type: 'boolean'}}});
const [file] = positionals;
if (!file) { console.error('Usage: episode-to-post.mjs <episode.ts> [--youtube <id>] [--date YYYY-MM-DD] [--force]'); process.exit(1); }
const module = await import(pathToFileURL(path.resolve(file)).href);
const episode = Object.values(module).find(value => value && typeof value === 'object' && Array.isArray(value.scenes));
if (!episode) throw new Error(`${file} exports no episode`);
const number = Number(/^ep(\d+)$/.exec(episode.id)?.[1]);
if (!number) throw new Error(`Unexpected episode id ${episode.id}`);

const quote = text => JSON.stringify(text);
const date = values.date ?? new Date().toISOString().slice(0, 10);
const slug = `ep${String(number).padStart(3, '0')}`;
const lines = [
  '---',
  `title: ${quote(episode.title)}`,
  `date: ${date}`,
  `summary: ${quote(episode.subtitle ?? '')}`,
  `episode: ${number}`,
  ...(values.youtube ? [`youtube: ${values.youtube}`] : []),
  ...(episode.tags?.length ? [`tags: [${episode.tags.join(', ')}]`] : []),
  // New episodes point blog.url at this site's /ep short link; only an older Notion URL is worth keeping.
  ...(episode.blog?.url && !/\/\/ginseng\.dnplus\.dev\//.test(episode.blog.url) ? [`legacyUrl: ${episode.blog.url}`] : []),
  'draft: true',
  '---',
  '',
];
for (const scene of episode.scenes) {
  lines.push(`## ${scene.title}`, '');
  for (const beat of scene.beats) lines.push(beat.narration.trim(), '');
}
if (episode.sources?.length) {
  lines.push('## 參考資料', '');
  for (const source of episode.sources) lines.push(`- [${source.title}](${source.url})`);
  lines.push('');
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'content/posts/zh-TW', `${slug}.md`);
if (existsSync(out) && !values.force) { console.error(`${path.relative(root, out)} exists; pass --force to overwrite`); process.exit(1); }
mkdirSync(path.dirname(out), {recursive: true});
writeFileSync(out, lines.join('\n'));
console.log(`Wrote ${path.relative(root, out)} (draft). Edit it, then remove "draft: true" to publish.`);
