export const CHANNEL_URL = 'https://www.youtube.com/@GinsengTryCatch';
const FEED_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC-hFgSev3WsmCOQT_rqm6gQ';

export type Video = {id: string; title: string; summary: string; published: string; views: number | null};

// Shown when the feed is unreachable, so the page never renders an empty works section.
export const FALLBACK_VIDEOS: Video[] = [
  {id: '_f8oRrxBmGw', title: 'Codex 額度又用完？加錢前，先查誰在燒', summary: '先查任務、模型與推理設定，再決定要不要加錢', published: '2026-10-06T03:45:38+00:00', views: null},
  {id: 'bvRPXARAK0A', title: '給員工用的 AI 平台？為什麼有安全控管，企業才敢把最強 Agent 開給你？', summary: '', published: '2026-09-19T09:01:31+00:00', views: null},
  {id: 'M-b9-b3OVEg', title: 'Notion 把「電腦」獨立出來了：AI 蜜月期結束，頭部廠商開始收網的警訊', summary: '', published: '2026-09-22T05:51:36+00:00', views: null},
  {id: 'j7nu_6cprMI', title: 'Agent 帳單爆炸？把「做決定」交給 Jev，快 200 倍、便宜 400 倍', summary: '', published: '2026-09-19T08:18:24+00:00', views: null},
  {id: 'kayiWSwUHxc', title: 'Apple Silicon 留住了我，但 Omarchy 讓我想離開 macOS', summary: '', published: '2026-09-09T12:32:44+00:00', views: null},
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

let memo: {at: number; videos: Video[]} | undefined;
export async function latestVideos(fetcher: typeof fetch = fetch): Promise<Video[]> {
  if (memo && Date.now() - memo.at < 15 * 60_000) return memo.videos;
  try {
    const response = await fetcher(FEED_URL, {signal: AbortSignal.timeout(3000)});
    if (!response.ok) throw new Error(`feed ${response.status}`);
    const videos = parseFeed(await response.text());
    if (!videos.length) throw new Error('feed empty');
    memo = {at: Date.now(), videos};
    return videos;
  } catch (error) {
    console.error('YouTube feed unavailable, using last known list:', error instanceof Error ? error.message : error);
    // Keep the last good list and retry after a minute instead of waiting on every request.
    memo = {at: Date.now() - 14 * 60_000, videos: memo?.videos ?? FALLBACK_VIDEOS};
    return memo.videos;
  }
}

export const thumbnail = (id: string, size: 'maxresdefault' | 'mqdefault' = 'maxresdefault') => `https://i.ytimg.com/vi/${id}/${size}.jpg`;
export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
