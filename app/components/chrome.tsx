import { ArrowUpRight, Camera, Globe, Menu, MessageCircle, PlaySquare, AtSign, ThumbsUp } from 'lucide-react';
import { dictionary, LANGUAGE_NAME, localePath, LOCALES, HTML_LANG, type Locale } from '@/lib/i18n';
import { socials, type Social } from '@/lib/site';

export const external = {target: '_blank', rel: 'noopener noreferrer'} as const;

export function Plaque({locale}: {locale: Locale}) {
  return locale === 'en' ? <span className="plaque"><b>Ginseng</b> TRY CATCH</span> : <span className="plaque"><b>人蔘</b> TRY CATCH</span>;
}

const ICONS = {youtube: PlaySquare, threads: MessageCircle, instagram: Camera, x: AtSign, facebook: ThumbsUp} as const;
export function SocialIcon({social, size = 17}: {social: Social; size?: number}) { const Icon = ICONS[social.icon]; return <Icon size={size}/>; }

function navItems(locale: Locale) {
  const t = dictionary(locale).nav, at = (path: string) => localePath(locale, path);
  return [
    {href: at('/blog'), label: t.blog},
    {href: at('/lab'), label: t.lab},
    {href: `${at('/')}#videos`, label: t.videos},
    {href: at('/community'), label: t.community},
    {href: `${at('/')}#contact`, label: t.contact},
  ];
}

/**
 * Links to the same page in the other languages. `path` is the locale-neutral path of the current page; `available`
 * lists the languages that page exists in, so a Chinese-only article does not link to a missing English page.
 */
export function LanguageSwitch({locale, path, available = LOCALES}: {locale: Locale; path: string; available?: readonly Locale[]}) {
  const others = available.filter(each => each !== locale);
  if (!others.length) return null;
  return <nav className="lang-switch" aria-label={dictionary(locale).language.label}><Globe size={16} aria-hidden="true"/>{others.map(each =>
    <a key={each} href={localePath(each, path)} hrefLang={HTML_LANG[each]} lang={HTML_LANG[each]}>{LANGUAGE_NAME[each]}</a>)}</nav>;
}

export function SiteHeader({locale, path, available}: {locale: Locale; path: string; available?: readonly Locale[]}) {
  const t = dictionary(locale), items = navItems(locale), subscribe = localePath(locale, '/newsletter');
  return <header className="header">
    <a href={localePath(locale, '/')} aria-label={t.homeLabel}><Plaque locale={locale}/></a>
    <nav className="desktop-nav" aria-label={t.nav.main}>{items.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}<LanguageSwitch locale={locale} path={path} available={available}/><a className="nav-cta" href={subscribe}>{t.nav.subscribe}</a></nav>
    <details className="mobile-menu"><summary aria-label={t.nav.menu}><Menu size={24}/></summary><nav aria-label={t.nav.mobile}>{items.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}<a href={subscribe}>{t.nav.subscribe}</a><LanguageSwitch locale={locale} path={path} available={available}/></nav></details>
  </header>;
}

/** Header for pages other than the home hero: same navigation on a plain band. */
export function PageTop(props: {locale: Locale; path: string; available?: readonly Locale[]}) {
  return <div className="page-top"><SiteHeader {...props}/></div>;
}

export function SocialLinks({locale, className = 'hero-socials'}: {locale: Locale; className?: string}) {
  return <nav className={className} aria-label={dictionary(locale).home.socials}>{socials(locale).map(social =>
    <a key={social.url} href={social.url} {...external}><SocialIcon social={social}/>{social.name}<ArrowUpRight size={14}/></a>)}</nav>;
}

export function SiteFooter({locale, path, available}: {locale: Locale; path: string; available?: readonly Locale[]}) {
  const t = dictionary(locale);
  return <footer className="footer">
    <div className="wrap footer-inner">
      <div><a href={localePath(locale, '/')} aria-label={t.homeLabel}><Plaque locale={locale}/></a><p>{t.footer.tagline}</p></div>
      <nav aria-label={t.footer.nav}>{socials(locale).map(social => <a key={social.url} href={social.url} {...external}>{social.name}</a>)}<a href={localePath(locale, '/blog')}>{t.nav.blog}</a><a href={localePath(locale, '/lab')}>{t.nav.lab}</a><a href={localePath(locale, '/community')}>{t.nav.community}</a><a href={localePath(locale, '/newsletter')}>{t.nav.subscribe}</a><a href={localePath(locale, '/privacy')}>{t.footer.privacy}</a><LanguageSwitch locale={locale} path={path} available={available}/><span>© 2026 Ginseng Try Catch</span></nav>
    </div>
  </footer>;
}
