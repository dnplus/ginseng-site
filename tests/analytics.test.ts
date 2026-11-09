import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyticsAllowed, gtmSnippet, validGtmId } from '../lib/analytics.ts';

test('pages whose URL carries a personal token, and the studio, never load analytics', () => {
  for (const path of ['/studio', '/studio/x', '/unsubscribe', '/newsletter/confirm', '/en/newsletter/confirm']) assert.equal(analyticsAllowed(path), false, path);
  for (const path of ['/', '/en', '/blog', '/blog/ep083', '/newsletter', '/newsletter/2026-11', '/en/newsletter/confirmed-later', '/studios']) assert.equal(analyticsAllowed(path), true, path);
});

test('only a well-formed container id is inlined', () => {
  assert.equal(validGtmId('GTM-KSFN2FCB'), 'GTM-KSFN2FCB');
  for (const bad of [undefined, '', 'G-ABC123', "GTM-X');alert(1);//", 'gtm-ksfn2fcb']) assert.equal(validGtmId(bad), null, String(bad));
  assert.ok(gtmSnippet('GTM-KSFN2FCB').includes("'dataLayer','GTM-KSFN2FCB')"));
});
