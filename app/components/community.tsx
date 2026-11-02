import { ArrowLeft, ArrowUpRight, BadgeCheck, MessagesSquare, Rocket, Languages } from 'lucide-react';
import { NewsletterSection } from './home';
import { external, PageTop, SiteFooter } from './chrome';
import { dictionary, localePath, type Locale } from '@/lib/i18n';
import { DISCORD_INVITE_URL } from '@/lib/site';

const PERK_ICONS = [MessagesSquare, Rocket, Languages];

export function CommunityPage({locale}: {locale: Locale}) {
  const t = dictionary(locale).community;
  return <>
    <a className="skip-link" href="#main">{dictionary(locale).skip}</a>
    <PageTop locale={locale} path="/community"/>
    <main id="main" className="section-page projects" aria-labelledby="community-title">
      <div className="wrap">
        <a className="back-link" href={localePath(locale, '/')}><ArrowLeft size={17}/>{t.back}</a>
        <p className="section-sticker">{t.sticker}</p>
        <h1 id="community-title">{t.heading}</h1>
        <p className="projects-intro">{t.lead}</p>
        <ul className="hub-grid perks">{t.perks.map(([title, body], index) => { const Icon = PERK_ICONS[index] ?? MessagesSquare; return <li key={title} className="hub-card"><span className="project-icon"><Icon size={24}/></span><h2>{title}</h2><p>{body}</p></li>; })}</ul>
        <article className="project supporters">
          <span className="project-icon"><BadgeCheck size={26}/></span>
          <div><h2>{t.supporters}</h2><p>{t.supportersBody}</p></div>
        </article>
        {DISCORD_INVITE_URL
          ? <p className="community-join"><a className="button primary" href={DISCORD_INVITE_URL} {...external}>{t.join} <ArrowUpRight size={19}/></a></p>
          : <div className="community-soon" role="note"><h2>{t.soonTitle}</h2><p>{t.soonBody}</p></div>}
      </div>
    </main>
    <NewsletterSection locale={locale}/>
    <SiteFooter locale={locale} path="/community"/>
  </>;
}
