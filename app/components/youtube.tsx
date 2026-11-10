'use client';
import { useState, type ReactNode } from 'react';
import { Play } from 'lucide-react';
import { track } from '@/lib/analytics';
import type { Locale } from '@/lib/i18n';
import { embedUrl, SUBSCRIBE_URL, thumbnail } from '@/lib/youtube';

/** "Subscribe on YouTube": opens the channel's subscribe dialog in a new tab and counts the click in GTM. */
export function SubscribeLink({locale, placement, className, label, children}: {locale: Locale; placement: 'header' | 'hero' | 'intro' | 'videos'; className?: string; label?: string; children: ReactNode}) {
  return <a className={className} href={SUBSCRIBE_URL} target="_blank" rel="noopener noreferrer" aria-label={label}
    onClick={() => track('youtube_subscribe_click', {locale, placement})}>{children}</a>;
}

/**
 * Click-to-play video. The first render is only a thumbnail button, so the page makes no request to YouTube until
 * the visitor presses play; then the privacy-enhanced (youtube-nocookie) player replaces it and starts playing.
 * `label` names the play button, e.g. "Play: <title>".
 */
export function VideoFacade({id, title, label}: {id: string; title: string; label: string}) {
  const [playing, setPlaying] = useState(false);
  if (playing) return <span className="thumb player"><iframe src={embedUrl(id)} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></span>;
  return <button type="button" className="thumb poster" onClick={() => setPlaying(true)} aria-label={label}>
    <img src={thumbnail(id)} alt="" width="1280" height="720" fetchPriority="high"/>
    <i className="play" aria-hidden="true"><Play size={30} fill="currentColor"/></i>
  </button>;
}
