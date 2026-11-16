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
