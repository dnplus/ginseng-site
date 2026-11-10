'use client';
import type { ReactNode } from 'react';
import { track } from '@/lib/analytics';
import type { Locale } from '@/lib/i18n';
import { SUBSCRIBE_URL } from '@/lib/youtube';

/** "Subscribe on YouTube": opens the channel's subscribe dialog in a new tab and counts the click in GTM. */
export function SubscribeLink({locale, placement, className, children}: {locale: Locale; placement: 'header' | 'menu' | 'hero'; className?: string; children: ReactNode}) {
  return <a className={className} href={SUBSCRIBE_URL} target="_blank" rel="noopener noreferrer"
    onClick={() => track('youtube_subscribe_click', {locale, placement})}>{children}</a>;
}
