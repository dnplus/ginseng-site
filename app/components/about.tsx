import { ArrowLeft } from 'lucide-react';
import { ContactForm } from './forms';
import { PageTop, SiteFooter } from './chrome';
import { NewsletterSection } from './home';
import { dictionary, localePath, type Locale } from '@/lib/i18n';

/** Who Ginseng is, and the collaboration form. Moved off the home page so it leads with videos. */
export function AboutPage({locale}: {locale: Locale}) {
  const t = dictionary(locale), a = t.about;
  return <>
    <a className="skip-link" href="#main">{t.skip}</a>
    <PageTop locale={locale} path="/about"/>
    <main id="main">
      <section className="about" id="about" aria-labelledby="about-title">
        <div className="wrap">
          <a className="back-link" href={localePath(locale, '/')}><ArrowLeft size={17}/>{a.back}</a>
          <div className="about-grid">
            <div className="about-copy">
              <p className="section-sticker">{a.aboutSticker}</p>
              <h1 id="about-title">{a.aboutTitle[0]}<br/>{a.aboutTitle[1]}</h1>
              <p className="lead">{a.aboutLead}</p>
              {a.aboutBody.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            </div>
            <figure className="code-card">
              <div className="code-bar" aria-hidden="true"><i/><i/><i/><span>life.ts</span></div>
              <pre aria-hidden="true"><code>{[
                <><span className="k">try</span> {'{'}</>,
                <>  <span className="f">{a.codeLife}</span>();</>,
                <>{'}'} <span className="k">catch</span> (e) {'{'}</>,
                <>  <span className="c">{a.codeComment}</span></>,
                <>  <span className="f">{a.codeCatch}</span>(e);</>,
                <>{'}'}</>,
              ].map((line, index) => <span className="line" key={index}>{line}</span>)}</code></pre>
              <figcaption>{a.codeCaption}</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="contact" id="contact" aria-labelledby="contact-title">
        <div className="wrap contact-grid">
          <div className="contact-copy">
            <p className="section-sticker">{a.contactSticker}</p>
            <h2 id="contact-title">{a.contactTitle[0]}<br/>{a.contactTitle[1]}</h2>
            <p className="lead">{a.contactLead}</p>
            <dl className="services">{a.services.map(([title, body]) => <div key={title}><dt>{title}</dt><dd>{body}</dd></div>)}</dl>
          </div>
          <div className="form-card"><ContactForm locale={locale}/></div>
        </div>
      </section>
    </main>
    <NewsletterSection locale={locale}/>
    <SiteFooter locale={locale} path="/about"/>
  </>;
}
