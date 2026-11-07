import { ArrowLeft, ArrowUpRight, Play, Rss } from 'lucide-react';
import { NewsletterSection } from './home';
import { external, PageTop, SiteFooter } from './chrome';
import { DEFAULT_LOCALE, dictionary, HTML_LANG, LOCALES, localePath, type Locale } from '@/lib/i18n';
import { postPath, type Post } from '@/lib/blog';
import { posts, renderMarkdown } from '@/lib/posts';
import { thumbnail, watchUrl } from '@/lib/youtube';

const dateLabel = (date: string, locale: Locale) => new Intl.DateTimeFormat(locale, {dateStyle: 'long', timeZone: 'Asia/Taipei'}).format(new Date(`${date}T12:00:00+08:00`));

/** Every card gets a picture: an explicit cover, the video thumbnail, the post's first image, or the mascot. */
function PostThumb({post}: {post: Post}) {
  const src = post.cover ?? (post.youtube ? thumbnail(post.youtube, 'mqdefault') : post.firstImage);
  if (src) return <span className="thumb"><img src={src} alt="" width="320" height="180" loading="lazy"/></span>;
  return <span className="thumb thumb-mascot"><img src="/assets/ginseng-cutout.webp" alt="" width="320" height="180" loading="lazy"/></span>;
}

function PostCard({post, locale}: {post: Post; locale: Locale}) {
  const t = dictionary(post.locale).blog;
  return <li><a className="post-card" href={localePath(post.locale, postPath(post))} lang={post.locale === locale ? undefined : HTML_LANG[post.locale]}>
    <PostThumb post={post}/>
    <span className="post-card-text">
      <small>{post.episode ? `${t.episode(post.episode)} · ` : ''}<time dateTime={post.date}>{dateLabel(post.date, post.locale)}</time></small>
      <h2>{post.title}</h2>
      {post.summary && <p>{post.summary}</p>}
    </span>
  </a></li>;
}

export function BlogIndex({locale}: {locale: Locale}) {
  const t = dictionary(locale).blog, list = posts.list(locale);
  // English readers still get a way into the Mandarin archive while the English list is short.
  const others = LOCALES.filter(each => each !== locale);
  return <>
    <a className="skip-link" href="#main">{dictionary(locale).skip}</a>
    <PageTop locale={locale} path="/blog"/>
    <main id="main" className="section-page blog" aria-labelledby="blog-title">
      <div className="wrap">
        <p className="section-sticker">{t.sticker}</p>
        <h1 id="blog-title">{t.heading}</h1>
        <p className="projects-intro">{t.lead}</p>
        <a className="feed-link" href={localePath(locale, '/feed.xml')}><Rss size={15}/>{t.feed}</a>
        {list.length ? <ul className="post-list">{list.map(post => <PostCard key={post.slug} post={post} locale={locale}/>)}</ul> : <p className="blog-empty">{t.empty}</p>}
        {others.map(other => { const more = posts.list(other); if (!more.length || (list.length && locale === DEFAULT_LOCALE)) return null; return <section key={other} className="blog-other" lang={HTML_LANG[other]} aria-labelledby={`more-${other}`}>
          <h2 id={`more-${other}`}>{t.otherLanguage}</h2>
          <ul className="post-list">{more.slice(0, 6).map(post => <PostCard key={post.slug} post={post} locale={locale}/>)}</ul>
          <a className="pill-link" href={localePath(other, '/blog')}>{dictionary(other).blog.back} <ArrowUpRight size={16}/></a>
        </section>; })}
      </div>
    </main>
    <NewsletterSection locale={locale}/>
    <SiteFooter locale={locale} path="/blog"/>
  </>;
}

export function BlogPost({post}: {post: Post}) {
  const locale = post.locale, t = dictionary(locale).blog;
  const available = posts.translations(post).map(each => each.locale);
  const path = postPath(post);
  return <>
    <a className="skip-link" href="#main">{dictionary(locale).skip}</a>
    <PageTop locale={locale} path={path} available={available}/>
    <main id="main" className="article-page">
      <article className="article" aria-labelledby="post-title">
        <a className="back-link" href={localePath(locale, '/blog')}><ArrowLeft size={17}/>{t.back}</a>
        <p className="article-meta">{post.episode ? <span className="section-sticker">{t.episode(post.episode)}</span> : null}<time dateTime={post.date}>{dateLabel(post.date, locale)}</time></p>
        <h1 id="post-title">{post.title}</h1>
        {post.summary && <p className="article-lead">{post.summary}</p>}
        {posts.translations(post).filter(each => each.locale !== locale).map(each =>
          <p key={each.locale} className="article-translation"><a href={localePath(each.locale, postPath(each))} hrefLang={HTML_LANG[each.locale]} lang={HTML_LANG[each.locale]}>{dictionary(each.locale).blog.sticker}: {each.title} <ArrowUpRight size={14}/></a></p>)}
        {post.translatedFrom && <p className="article-note">{t.translated}</p>}
        {post.youtube && <a className="article-video" href={watchUrl(post.youtube)} {...external}>
          <span className="thumb"><img src={thumbnail(post.youtube)} alt="" width="1280" height="720" fetchPriority="high"/><i className="play"><Play size={26} fill="currentColor"/></i></span>
          <span>{t.watch} <ArrowUpRight size={16}/></span>
        </a>}
        <div className="prose" dangerouslySetInnerHTML={{__html: renderMarkdown(post.body)}}/>
        {post.tags.length > 0 && <ul className="article-tags">{post.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>}
      </article>
    </main>
    <NewsletterSection locale={locale}/>
    <SiteFooter locale={locale} path={path} available={available}/>
  </>;
}
