'use client';
import { useEffect, useRef } from 'react';
import { ADSENSE_ARTICLE_SLOT, ADSENSE_CLIENT, adsenseScript } from '@/lib/ads';

type AdsWindow = Window & { adsbygoogle?: unknown[] };

/** The article's AdSense unit. Space is reserved in CSS so the text below does not jump when the ad fills in. */
export function ArticleAd({label}: {label: string}) {
  const slot = useRef<HTMLModElement>(null);
  useEffect(() => {
    if (!slot.current || slot.current.dataset.adsbygoogleStatus) return;
    try { ((window as AdsWindow).adsbygoogle ??= []).push({}); } catch { /* blocked by an ad blocker */ }
  }, []);
  return <aside className="article-ad" aria-label={label}>
    <script async src={adsenseScript} crossOrigin="anonymous"/>
    <span className="article-ad-label">{label}</span>
    <ins ref={slot} className="adsbygoogle" style={{display: 'block'}} data-ad-client={ADSENSE_CLIENT} data-ad-slot={ADSENSE_ARTICLE_SLOT}
      data-ad-format="auto" data-full-width-responsive="true"/>
  </aside>;
}
