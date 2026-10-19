export const CHANNEL_URL = 'https://www.youtube.com/@GinsengTryCatch';
const FEED_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC-hFgSev3WsmCOQT_rqm6gQ';

export type Video = {id: string; title: string; summary: string; published: string | null; publishedLabel?: string; views: number | null; isFallback?: boolean};

// Public YouTube metadata refreshed 2026-10-19. Omit stale view counts when RSS is unavailable.
export const FALLBACK_VIDEOS: Video[] = [
  {
    "id": "RmG6Nr_ZUsA",
    "title": "Obsidian vs Notion：AI 時代，我為什麼還留在 Notion？",
    "summary": "",
    "published": "2026-10-18T02:14:58-07:00",
    "views": null
  },
  {
    "id": "tbj0Azzlguw",
    "title": "我讓 AI 替我玩自己做的遊戲：PA Cafe 開發日誌",
    "summary": "",
    "published": "2026-10-17T04:57:47-07:00",
    "views": null
  },
  {
    "id": "qYb05xljWsw",
    "title": "我做了一間咖啡廳，給 AI 助理住",
    "summary": "",
    "published": "2026-10-16T09:39:43-07:00",
    "views": null
  },
  {
    "id": "0qLd39Vytw0",
    "title": "Grok Bot 為啥要借用我電腦上網？",
    "summary": "",
    "published": "2026-10-14T06:24:31-07:00",
    "views": null
  },
  {
    "id": "NyGb61ytNy8",
    "title": "XPass 今天上了，我從 Cursor 過來先看一件事：額度",
    "summary": "",
    "published": "2026-10-13T00:24:38-07:00",
    "views": null
  }
];

const entities: Record<string, string> = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'"};
function decode(text: string) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (match, code: string) => {
    if (code[0] !== '#') return entities[code] ?? match;
    const point = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return Number.isFinite(point) ? String.fromCodePoint(point) : match;
  });
}
const tag = (xml: string, name: string) => xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1];

export function parseFeed(xml: string): Video[] {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].flatMap(([, entry]) => {
    const id = tag(entry, 'yt:videoId'), title = tag(entry, 'title'), published = tag(entry, 'published');
    if (!id || !/^[\w-]{11}$/.test(id) || !title || !published || /href="[^"]*\/shorts\//.test(entry)) return [];
    const firstLine = decode(tag(entry, 'media:description') ?? '').split('\n').map(line => line.trim()).find(Boolean) ?? '';
    const summary = /https?:|^章節|^\d{1,2}:\d{2}/.test(firstLine) ? '' : firstLine.slice(0, 90);
    const views = entry.match(/<media:statistics views="(\d+)"/)?.[1];
    return [{id, title: decode(title).trim(), summary, published, views: views ? Number(views) : null}];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function at(value: unknown, ...keys: string[]): unknown {
  for (const key of keys) {
    if (!isRecord(value)) return undefined;
    value = value[key];
  }
  return value;
}
export function parseChannelPage(html: string): Video[] {
  const serialized = html.match(/var\s+ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/)?.[1];
  if (!serialized) return [];
  const data: unknown = JSON.parse(serialized);
  const videos = new Map<string, Video>();
  function visit(node: unknown) {
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (!isRecord(node)) return;
    const model = node.lockupViewModel;
    const id = at(model, 'contentId');
    const title = at(model, 'metadata', 'lockupMetadataViewModel', 'title', 'content');
    if (at(model, 'contentType') === 'LOCKUP_CONTENT_TYPE_VIDEO' && typeof id === 'string' && /^[\w-]{11}$/.test(id) && typeof title === 'string') {
      const rows = at(model, 'metadata', 'lockupMetadataViewModel', 'metadata', 'contentMetadataViewModel', 'metadataRows');
      const parts: unknown[] = Array.isArray(rows) ? rows.flatMap(row => { const value = at(row, 'metadataParts'); return Array.isArray(value) ? value : []; }) : [];
      const labels = parts.map(part => at(part, 'text', 'content'));
      const publishedLabel = labels.find(label => typeof label === 'string' && /前|ago|昨天|今天|yesterday|today/i.test(label));
      const countLabel = parts.map(part => at(part, 'accessibilityLabel')).find(label => typeof label === 'string' && /觀看次數|views/i.test(label));
      const count = typeof countLabel === 'string' ? countLabel.match(/(?:觀看次數[:：]\s*([\d,]+)\s*次|^([\d,]+) views$)/)?.slice(1).find(Boolean) : undefined;
      videos.set(id, {id, title, summary: '', published: null, publishedLabel: typeof publishedLabel === 'string' ? publishedLabel : undefined, views: count ? Number(count.replaceAll(',', '')) : null});
    }
    Object.values(node).forEach(visit);
  }
  visit(data);
  return [...videos.values()].slice(0, 5);
}

let memo: {at: number; videos: Video[]} | undefined;
export async function latestVideos(fetcher: typeof fetch = fetch): Promise<Video[]> {
  if (memo && Date.now() - memo.at < 15 * 60_000) return memo.videos;
  for (const source of [
    {url: FEED_URL, parse: parseFeed, name: 'RSS'},
    {url: `${CHANNEL_URL}/videos?hl=zh-TW`, parse: parseChannelPage, name: 'channel page'},
  ]) {
    try {
      const response = await fetcher(source.url, {signal: AbortSignal.timeout(3000)});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const videos = source.parse(await response.text());
      if (!videos.length) throw new Error('empty video list');
      memo = {at: Date.now(), videos};
      return videos;
    } catch (error) {
      console.error(`YouTube ${source.name} unavailable:`, error instanceof Error ? error.message : 'request failed');
    }
  }
  const videos = (memo?.videos ?? FALLBACK_VIDEOS).map(video => ({...video, isFallback: true, views: null}));
  memo = {at: Date.now() - 14 * 60_000, videos};
  return videos;
}

export const thumbnail = (id: string, size: 'maxresdefault' | 'mqdefault' = 'maxresdefault') => `https://i.ytimg.com/vi/${id}/${size}.jpg`;
export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
