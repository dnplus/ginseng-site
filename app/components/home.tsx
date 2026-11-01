import { ArrowUpRight, Coffee, FlaskConical, Play, PlaySquare, Sparkles, Terminal, Users } from 'lucide-react';
import { ContactForm, NewsletterForm } from './forms';
import { external, SiteFooter, SiteHeader, SocialLinks } from './chrome';
import { dictionary, localePath, type Locale } from '@/lib/i18n';
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
  const hub = [
    {...t.hub.youtube, href: CHANNEL_URL, icon: PlaySquare, external: true},
    {...t.hub.pacafe, href: PA_CAFE_URL, icon: Coffee, external: true},
    {...t.hub.lab, href: at('/lab'), icon: FlaskConical, external: false},
    {...t.hub.community, href: at('/community'), icon: Users, external: false},
  ];
  // English visitors mostly arrive for PA Cafe and the tools; Chinese visitors mostly from YouTube.
  const primary = locale === 'en' ? {href: PA_CAFE_URL, ...external} : {href: '#videos'};

  return <>
    <a className="skip-link" href="#main">{t.skip}</a>
    <div className="stage">
      <div className="panel">
        <SiteHeader locale={locale} path="/"/>
        <main id="main" className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="hello">{h.hello}</p>
            <h1 id="hero-title">{h.title[0]}<br/><span className="hero-highlight">{h.title[1]}</span></h1>
            <p className="hero-lead">{h.lead}</p>
            <div className="hero-actions">
              <a className="button primary" {...primary}>{h.primary} <ArrowUpRight size={19}/></a>
              <a className="button ghost" href="#contact">{h.secondary}</a>
            </div>
            <SocialLinks locale={locale}/>
            <a className="fresh" href={watchUrl(featured.id)} {...external}>
              <img src={thumbnail(featured.id, 'mqdefault')} alt="" width="320" height="180" loading="lazy"/>
              <span><small>{h.latest}{videoAge(featured) ? `・${videoAge(featured)}` : ''}</small>{featured.title}</span>
            </a>
          </div>
          <div className="mascot" aria-hidden="true">
            <span className="note">{h.mascotNote}<svg viewBox="0 0 60 30" aria-hidden="true"><path d="M3 22C17 8 36 6 55 14M55 14l-11-7M55 14l-12 4"/></svg></span>
            <img src="/assets/ginseng-cutout.webp" alt="" width="900" height="900" fetchPriority="high"/>
          </div>
        </main>
      </div>
    </div>

    <section className="hub" id="start" aria-labelledby="hub-title">
      <div className="wrap">
        <p className="section-sticker">{h.hubSticker}</p>
        <h2 id="hub-title">{h.hubTitle}</h2>
        <p className="projects-intro">{h.hubIntro}</p>
        <ul className="hub-grid">{hub.map(card => { const Icon = card.icon; return <li key={card.title}>
          <a className="hub-card" href={card.href} {...(card.external ? external : {})}>
            <span className="project-icon"><Icon size={26}/></span>
            <small>{card.kicker}</small><h3>{card.title}</h3><p>{card.body}</p>
            <span className="hub-cta">{card.cta} <ArrowUpRight size={16}/></span>
          </a>
        </li>; })}</ul>
      </div>
    </section>

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
          <a className="pill-link" href={CHANNEL_URL} {...external}>{h.channel} <ArrowUpRight size={17}/></a>
        </div>
        <div className="videos-grid">
          <a className="feature" href={watchUrl(featured.id)} {...external}>
            <span className="thumb"><img src={thumbnail(featured.id)} alt="" width="1280" height="720" loading="lazy"/><i className="play"><Play size={26} fill="currentColor"/></i>{popular?.id === featured.id && <em className="tag">{h.popular}</em>}</span>
            <span className="meta">{meta(featured)}</span>
            <h3 lang="zh-Hant-TW">{featured.title}</h3>
            {featured.summary && <p lang="zh-Hant-TW">{featured.summary}</p>}
          </a>
          <ul className="video-list">
            {list.map(video => <li key={video.id}><a href={watchUrl(video.id)} {...external}>
              <span className="thumb"><img src={thumbnail(video.id, 'mqdefault')} alt="" width="320" height="180" loading="lazy"/></span>
              <span><h3 lang="zh-Hant-TW">{video.title}</h3><span className="meta">{meta(video)}</span>{popular?.id === video.id && <em className="tag">{h.popular}</em>}</span>
            </a></li>)}
          </ul>
        </div>
      </div>
    </section>

    <section className="about" id="about" aria-labelledby="about-title">
      <div className="wrap about-grid">
        <div className="about-copy">
          <p className="section-sticker">{h.aboutSticker}</p>
          <h2 id="about-title">{h.aboutTitle[0]}<br/>{h.aboutTitle[1]}</h2>
          <p className="lead">{h.aboutLead}</p>
          {h.aboutBody.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <figure className="code-card">
          <div className="code-bar" aria-hidden="true"><i/><i/><i/><span>life.ts</span></div>
          <pre aria-hidden="true"><code>{[
            <><span className="k">try</span> {'{'}</>,
            <>  <span className="f">{h.codeLife}</span>();</>,
            <>{'}'} <span className="k">catch</span> (e) {'{'}</>,
            <>  <span className="c">{h.codeComment}</span></>,
            <>  <span className="f">{h.codeCatch}</span>(e);</>,
            <>{'}'}</>,
          ].map((line, index) => <span className="line" key={index}>{line}</span>)}</code></pre>
          <figcaption>{h.codeCaption}</figcaption>
        </figure>
      </div>
    </section>

    <section className="contact" id="contact" aria-labelledby="contact-title">
      <div className="wrap contact-grid">
        <div className="contact-copy">
          <p className="section-sticker">{h.contactSticker}</p>
          <h2 id="contact-title">{h.contactTitle[0]}<br/>{h.contactTitle[1]}</h2>
          <p className="lead">{h.contactLead}</p>
          <dl className="services">{h.services.map(([title, body]) => <div key={title}><dt>{title}</dt><dd>{body}</dd></div>)}</dl>
        </div>
        <div className="form-card"><ContactForm locale={locale}/></div>
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
