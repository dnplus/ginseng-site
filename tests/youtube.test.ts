import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FALLBACK_VIDEOS, latestVideos, parseFeed } from '../lib/youtube.ts';

const entry = (id: string, title: string, extra = '') => `<entry>
  <yt:videoId>${id}</yt:videoId>
  <title>${title}</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=${id}"/>
  <published>2026-10-06T03:45:38+00:00</published>
  ${extra}
</entry>`;

test('feed entries become videos with decoded titles, a short summary and view counts', () => {
  const [video] = parseFeed(`<feed>${entry('_f8oRrxBmGw', 'Codex &amp; Agent：「做決定」&#39;', '<media:group><media:description>先查任務，再決定要不要加錢\n\n章節\n00:00 開場</media:description><media:community><media:statistics views="48"/></media:community></media:group>')}</feed>`);
  assert.deepEqual(video, {id: '_f8oRrxBmGw', title: 'Codex & Agent：「做決定」\'', summary: '先查任務，再決定要不要加錢', published: '2026-10-06T03:45:38+00:00', views: 48});
});

test('shorts are skipped because the grid only fits 16:9 videos', () => {
  const shortEntry = entry('abcdefghijk', '直式短片').replace('/watch?v=abcdefghijk', '/shorts/abcdefghijk');
  assert.deepEqual(parseFeed(`<feed>${shortEntry}${entry('kayiWSwUHxc', '長片')}</feed>`).map(video => video.id), ['kayiWSwUHxc']);
});

test('descriptions that open with a link or chapter list do not leak into the summary', () => {
  const xml = entry('kayiWSwUHxc', '長片', '<media:description>https://example.com/article\n更多說明</media:description>');
  assert.equal(parseFeed(xml)[0].summary, '');
  assert.equal(parseFeed(xml)[0].views, null);
});

test('entries with a malformed video id are dropped so no broken thumbnail URL is rendered', () => {
  assert.deepEqual(parseFeed(entry('bad id"><script>', '惡意標題')), []);
});

test('an unreachable feed still yields videos so the works section never renders empty', async () => {
  const failing = (async () => { throw new Error('network down'); }) as unknown as typeof fetch;
  const originalError = console.error;
  console.error = () => {};
  try { assert.deepEqual(await latestVideos(failing), FALLBACK_VIDEOS); }
  finally { console.error = originalError; }
});
