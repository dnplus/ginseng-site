import assert from 'node:assert/strict';
import { test } from 'node:test';
import { splitForAd } from '../lib/ads.ts';

test('the ad goes right before the sources section, keeping its divider with it', () => {
  const html = '<p>內文</p>\n<hr>\n<h2>參考資料</h2>\n<ul><li>a</li></ul>';
  assert.deepEqual(splitForAd(html), ['<p>內文</p>\n', '<hr>\n<h2>參考資料</h2>\n<ul><li>a</li></ul>']);
  assert.deepEqual(splitForAd('<p>x</p><h2 id="r">延伸閱讀</h2><p>y</p>'), ['<p>x</p>', '<h2 id="r">延伸閱讀</h2><p>y</p>']);
});

test('a post without a sources section gets the ad after the whole body', () => {
  assert.deepEqual(splitForAd('<h2>最後</h2><p>x</p>'), ['<h2>最後</h2><p>x</p>', '']);
});

test('the root domain serves ads.txt and sends everything else to the site', async () => {
  const {ADS_TXT, rootDomainResponse} = await import('../lib/ads.ts');
  assert.equal(ADS_TXT, 'google.com, pub-6805910087572066, DIRECT, f08c47fec0942fa0\n');
  const ads = rootDomainResponse(new URL('https://dnplus.dev/ads.txt'))!;
  assert.equal(ads.status, 200);
  assert.equal(await ads.text(), ADS_TXT);
  const other = rootDomainResponse(new URL('https://dnplus.dev/blog/ep083?x=1'))!;
  assert.equal(other.status, 301);
  assert.equal(other.headers.get('Location'), 'https://ginseng.dnplus.dev/blog/ep083?x=1');
  assert.equal(rootDomainResponse(new URL('https://ginseng.dnplus.dev/ads.txt')), null);
});
