import { ArrowLeft } from 'lucide-react';
import { ConfirmSubscription, NewsletterForm } from './forms';
import { PageTop, SiteFooter } from './chrome';
import { dictionary, localePath, type Locale } from '@/lib/i18n';
import type { Post } from '@/lib/blog';
import { issues, renderMarkdown } from '@/lib/posts';

const dateLabel = (date: string, locale: Locale) => new Intl.DateTimeFormat(locale, {dateStyle: 'long', timeZone: 'Asia/Taipei'}).format(new Date(`${date}T12:00:00+08:00`));
export const issuePath = (issue: Pick<Post, 'slug'>) => `/newsletter/${issue.slug}`;

export function NewsletterPage({locale}: {locale: Locale}) {
  const t = dictionary(locale).newsletter, list = issues.list(locale);
  return <>
    <a className="skip-link" href="#main">{dictionary(locale).skip}</a>
    <PageTop locale={locale} path="/newsletter"/>
    <main id="main" className="section-page blog" aria-labelledby="newsletter-page-title">
      <div className="wrap">
        <p className="section-sticker">{t.sticker}</p>
        <h1 id="newsletter-page-title">{t.heading}</h1>
        <p className="projects-intro">{t.lead}</p>
        <div className="newsletter-signup"><NewsletterForm locale={locale}/></div>
        <h2 className="archive-title">{t.archive}</h2>
        {list.length ? <ul className="post-list">{list.map(issue => <li key={issue.slug}><a className="post-card" href={localePath(locale, issuePath(issue))}><span className="post-card-text">
          <small><time dateTime={issue.date}>{dateLabel(issue.date, locale)}</time></small><h2>{issue.title}</h2>{issue.summary && <p>{issue.summary}</p>}
        </span></a></li>)}</ul> : <p className="blog-empty">{t.archiveEmpty}</p>}
      </div>
    </main>
    <SiteFooter locale={locale} path="/newsletter"/>
  </>;
}

export function NewsletterIssue({issue}: {issue: Post}) {
  const locale = issue.locale, t = dictionary(locale).newsletter, path = issuePath(issue);
  const available = issues.translations(issue).map(each => each.locale);
  return <>
    <a className="skip-link" href="#main">{dictionary(locale).skip}</a>
    <PageTop locale={locale} path={path} available={available}/>
    <main id="main" className="article-page">
      <article className="article" aria-labelledby="issue-title">
        <a className="back-link" href={localePath(locale, '/newsletter')}><ArrowLeft size={17}/>{t.back}</a>
        <p className="article-meta"><span className="section-sticker">{t.sticker}</span><time dateTime={issue.date}>{dateLabel(issue.date, locale)}</time></p>
        <h1 id="issue-title">{issue.title}</h1>
        {issue.summary && <p className="article-lead">{issue.summary}</p>}
        <div className="prose" dangerouslySetInnerHTML={{__html: renderMarkdown(issue.body)}}/>
        <div className="newsletter-signup"><NewsletterForm locale={locale}/></div>
      </article>
    </main>
    <SiteFooter locale={locale} path={path} available={available}/>
  </>;
}

export function ConfirmPage({locale, token}: {locale: Locale; token: string}) {
  const t = dictionary(locale).newsletter;
  return <main className="subpage"><a href={localePath(locale, '/')}><ArrowLeft size={17}/>{dictionary(locale).community.back}</a><h1>{t.confirmTitle}</h1><ConfirmSubscription token={token} locale={locale}/></main>;
}
