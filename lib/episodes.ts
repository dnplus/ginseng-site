/**
 * Episode articles still on Notion, from the `blog.url` of each episode in agentic-remotion-studio. `/ep/<number>`
 * sends visitors here until the article is moved into content/posts (a post with `episode: <number>` wins).
 * Keep the Notion pages published: QR codes already burned into released videos point at them.
 */
export const LEGACY_EPISODE_ARTICLES: Record<number, string> = {
  68: 'https://ginseng.notion.site/3f03be7297e281cb8cdef98a702f6ac1',
  72: 'https://ginseng.notion.site/EP072-Codex-Grok-Bot-AI-3f33be7297e28107857ec35e3f2edc14',
  75: 'https://ginseng.notion.site/EP075-XPass-Cursor-3f83be7297e2816db4f0cdd6d26a4ac4',
  79: 'https://ginseng.notion.site/EP079-Obsidian-vs-Notion-AI-Notion-3fd3be7297e2818a8034d86a262a493c',
  80: 'https://ginseng.notion.site/EP080-Grok-Bot-3ff3be7297e281f181d5e0084386aff6',
  81: 'https://ginseng.notion.site/EP081-Zeabur-Railway-4013be7297e281719ddbc85a09d3f089',
  82: 'https://ginseng.notion.site/EP082-Grok-Bot-vs-Codex-4033be7297e28174b64dc34441050e3b',
};
