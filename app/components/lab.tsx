import { ArrowLeft } from 'lucide-react';
import { LabCard, NewsletterSection } from './home';
import { PageTop, SiteFooter } from './chrome';
import { dictionary, localePath, type Locale } from '@/lib/i18n';
import { LAB } from '@/lib/site';

export function LabPage({locale}: {locale: Locale}) {
  const t = dictionary(locale).lab;
  return <>
    <a className="skip-link" href="#main">{dictionary(locale).skip}</a>
    <PageTop locale={locale} path="/lab"/>
    <main id="main" className="section-page projects" aria-labelledby="lab-title">
      <div className="wrap">
        <a className="back-link" href={localePath(locale, '/')}><ArrowLeft size={17}/>{t.back}</a>
        <p className="section-sticker">{t.sticker}</p>
        <h1 id="lab-title">{t.heading}</h1>
        <p className="projects-intro">{t.lead}</p>
        {LAB.map(item => <div className="lab-entry" key={item.id}><span className={`lab-status lab-${item.status}`}>{t.status[item.status]}</span><LabCard item={item} locale={locale} headingLevel={2}/></div>)}
      </div>
    </main>
    <NewsletterSection locale={locale}/>
    <SiteFooter locale={locale} path="/lab"/>
  </>;
}
