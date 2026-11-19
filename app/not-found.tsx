import { headers } from 'next/headers';
import { PageTop, SiteFooter } from './components/chrome';
import { DEFAULT_LOCALE, dictionary, isLocale, localePath, type Locale } from '@/lib/i18n';
import { LOCALE_HEADER } from '@/lib/locale-header';

const COPY: Record<Locale, {sticker: string; title: string; body: string; home: string; blog: string}> = {
  'zh-TW': {
    sticker: '404 · NotFoundException',
    title: '這頁沒有被 catch 到。',
    body: '網址可能搬家了，或是還沒寫好。先回首頁或逛逛文章清單吧。',
    home: '回首頁',
    blog: '看所有文章',
  },
  en: {
    sticker: '404 · NotFoundException',
    title: 'This page was not caught.',
    body: 'The link may have moved or does not exist yet. Head back home or browse the blog.',
    home: 'Back to home',
    blog: 'Browse articles',
  },
};

export default async function NotFound() {
  const value = (await headers()).get(LOCALE_HEADER);
  const locale: Locale = isLocale(value) ? value : DEFAULT_LOCALE;
  const copy = COPY[locale];
  return <>
    <a className="skip-link" href="#main">{dictionary(locale).skip}</a>
    <PageTop locale={locale} path="/" available={[locale]}/>
    <main id="main" className="section-page" aria-labelledby="not-found-title">
      <div className="wrap">
        <p className="section-sticker">{copy.sticker}</p>
        <h1 id="not-found-title">{copy.title}</h1>
        <p className="projects-intro">{copy.body}</p>
        <div className="hero-actions">
          <a className="button primary" href={localePath(locale, '/')}>{copy.home}</a>
          <a className="button ghost" href={localePath(locale, '/blog')}>{copy.blog}</a>
        </div>
      </div>
    </main>
    <SiteFooter locale={locale} path="/" available={[locale]}/>
  </>;
}
