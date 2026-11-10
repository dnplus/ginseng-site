import { ArrowUpRight, Coffee, PlaySquare, Sparkles, Terminal } from 'lucide-react';
import { NewsletterForm } from './forms';
import { external, SiteFooter, SiteHeader, SocialLinks } from './chrome';
import { SubscribeLink, VideoFacade } from './youtube';
import { postPath } from '@/lib/blog';
import { dictionary, localePath, type Locale } from '@/lib/i18n';
import { posts } from '@/lib/posts';
import { CHANNEL_URL, LAB, PA_CAFE_URL, type LabItem } from '@/lib/site';
import { latestVideos, thumbnail, watchUrl, type Video } from '@/lib/youtube';

const LAB_ICONS = {coffee: Coffee, sparkles: Sparkles, terminal: Terminal} as const;

function ago(iso: string, locale: Locale) {
  const relative = new Intl.RelativeTimeFormat(locale, {numeric: 'auto'});
  const hours = (Date.parse(iso) - Date.now()) / 3_600_000;
  if (hours > -24) return relative.format(Math.min(-1, Math.round(hours)), 'hour');
  const days = Math.round(hours / 24);
  if (days > -14) return relative.format(days, 'day');
  if (days > -60) return relative.format(Math.round(days / 7), 'week');
  return relative.format(Math.round(days / 30), 'month');
}

export function LabCard({item, locale, headingLevel = 3}: {item: LabItem; locale: Locale; headingLevel?: 2 | 3}) {
  const t = dictionary(locale), Icon = LAB_ICONS[item.icon], Heading = headingLevel === 2 ? 'h2' : 'h3';
  return <article className={`project project-${item.id}`}>
    <span className="project-icon"><Icon size={26}/></span>
    <div><p className="project-kicker">{item.kicker[locale]}</p><Heading>{item.title[locale]}</Heading><p>{item.body[locale]}</p></div>
    <div className="project-links"><a className={item.featured ? 'button primary' : 'pill-link'} href={item.url} {...external}>{item.cta[locale]} <ArrowUpRight size={17}/></a>{item.video && <a className="quiet-link" href={watchUrl(item.video)} {...external}>{t.lab.watch}</a>}</div>
  </article>;
}

/** Where a video title goes: its article on this site when there is one, otherwise YouTube. */
function videoLink(video: Video, locale: Locale) {
  const post = posts.video(video.id, locale);
  return post ? {href: localePath(post.locale, postPath(post))} : {href: watchUrl(video.id), ...external};
}

export async function Home({locale}: {locale: Locale}) {
  const t = dictionary(locale), h = t.home, at = (path: string) => localePath(locale, path);
  const views = new Intl.NumberFormat(locale);
  const videoAge = (video: Video) => video.published ? ago(video.published, locale) : video.publishedLabel;
  const meta = (video: Video) => [videoAge(video), video.views === null ? null : h.views(views.format(video.views))].filter(Boolean).join(locale === 'en' ? ' · ' : '，');

  const videos = await latestVideos();
  const [featured, ...rest] = videos;
  const list = rest.slice(0, 4);
  const shown = [featured, ...list];
  const popular = shown.every(video => video.views !== null) ? shown.reduce((top, video) => (video.views! > top.views! ? video : top)) : null;
  // Chinese visitors mostly come from YouTube, so the hero asks them to subscribe; English visitors mostly arrive for PA Cafe.
  const primary = <>{h.primary} <ArrowUpRight size={19}/></>;

  return <>
    <a className="skip-link" href="#main">{t.skip}</a>
    <div className="stage">
      <div className="panel">
        <SiteHeader locale={locale} path="/"/>
        <main id="main" className="hero" aria-labelledby="hero-title">
          <article className="hero-video" aria-labelledby="latest-title">
            <VideoFacade id={featured.id} title={featured.title} label={h.play(featured.title)}/>
            <p className="meta">{h.latest}{meta(featured) ? ` · ${meta(featured)}` : ''}{popular?.id === featured.id && <em className="tag">{h.popular}</em>}</p>
            <h2 id="latest-title" lang="zh-Hant-TW"><a {...videoLink(featured, locale)}>{featured.title}</a></h2>
            {featured.summary && <p className="hero-video-summary" lang="zh-Hant-TW">{featured.summary}</p>}
          </article>
          <div className="hero-card">
            <img className="hero-mascot" src="/assets/ginseng-cutout.webp" alt="" width="900" height="900" loading="lazy"/>
            <p className="hello">{h.hello}</p>
            <h1 id="hero-title">{h.title[0]}<br/><span className="hero-highlight">{h.title[1]}</span></h1>
            <p className="hero-lead">{h.lead}</p>
            <div className="hero-actions">
              {locale === 'en'
                ? <a className="button primary" href={PA_CAFE_URL} {...external}>{primary}</a>
                : <SubscribeLink className="button primary" locale={locale} placement="hero">{primary}</SubscribeLink>}
              <a className="button ghost" href={`${at('/about')}#contact`}>{h.secondary}</a>
            </div>
            <SocialLinks locale={locale}/>
          </div>
        </main>
      </div>
    </div>

    <section className="projects" id="projects" aria-labelledby="projects-title">
      <div className="wrap">
        <p className="section-sticker">{h.projectsSticker}</p>
        <h2 id="projects-title">{h.projectsTitle}</h2>
        <p className="projects-intro">{h.projectsIntro}</p>
        {LAB.map(item => <LabCard key={item.id} item={item} locale={locale}/>)}
      </div>
    </section>

    <section className="videos" id="videos" aria-labelledby="videos-title">
      <div className="wrap">
        <div className="videos-head">
          <div><p className="section-sticker">{h.videosSticker}</p><h2 id="videos-title">{h.videosTitle}</h2><p>{h.videosIntro}{locale === 'en' ? ' ' : ''}{featured.isFallback ? h.videosFallback : h.videosLive}</p></div>
          <a className="pill-link" href={CHANNEL_URL} {...external}><PlaySquare size={17}/>{h.channel} <ArrowUpRight size={17}/></a>
        </div>
        <ul className="video-grid">
          {list.map(video => <li key={video.id}><a {...videoLink(video, locale)}>
            <span className="thumb"><img src={thumbnail(video.id, 'mqdefault')} alt="" width="320" height="180" loading="lazy"/></span>
            <div className="video-text"><h3 lang="zh-Hant-TW">{video.title}</h3><span className="meta">{meta(video)}</span>{popular?.id === video.id && <em className="tag">{h.popular}</em>}</div>
          </a></li>)}
        </ul>
      </div>
    </section>

    <NewsletterSection locale={locale}/>
    <SiteFooter locale={locale} path="/"/>
  </>;
}

export function NewsletterSection({locale}: {locale: Locale}) {
  const h = dictionary(locale).home;
  return <section className="newsletter" id="newsletter" aria-labelledby="newsletter-title">
    <div className="wrap newsletter-inner">
      <div><h2 id="newsletter-title">{h.newsletterTitle}</h2><p>{h.newsletterLead}</p></div>
      <NewsletterForm locale={locale}/>
    </div>
  </section>;
}
