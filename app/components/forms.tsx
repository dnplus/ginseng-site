'use client';
import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Check, LoaderCircle } from 'lucide-react';
import { TOPICS } from '@/lib/validation';
import { dictionary, localePath, type Locale } from '@/lib/i18n';

type Status = 'idle' | 'sending' | 'success' | 'error';
async function send(url: string, form: HTMLFormElement, locale: Locale) {
  const fields = Object.fromEntries(new FormData(form));
  const response = await fetch(url, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Site-Locale': locale}, body: JSON.stringify({...fields, consent: fields.consent === 'on', locale})});
  const result = await response.json() as {error?: string};
  if (!response.ok) throw new Error(result.error || dictionary(locale).forms.failed);
}
function Honeypot() { return <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>; }
function Submit({status, children, locale, className = ''}: {status: Status; children: React.ReactNode; locale: Locale; className?: string}) { return <button className={`button primary ${className}`} disabled={status === 'sending'} type="submit">{status === 'sending' ? <><LoaderCircle className="spin" size={18}/>{dictionary(locale).forms.sending}</> : <>{children}<ArrowUpRight size={19}/></>}</button>; }
function Consent({parts, locale}: {parts: string[]; locale: Locale}) {
  return <span>{parts[0]}<a href={localePath(locale, '/privacy')} target="_blank" rel="noopener noreferrer">{parts[1]}</a>{parts[2]}</span>;
}
export function ContactForm({locale = 'zh-TW'}: {locale?: Locale}) {
  const t = dictionary(locale).forms;
  const [status, setStatus] = useState<Status>('idle'), [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (status === 'sending') return;
    const form = event.currentTarget; setStatus('sending'); setError('');
    try { await send('/api/contact', form, locale); setStatus('success'); form.reset(); } catch (e) { setError(e instanceof Error ? e.message : t.network); setStatus('error'); }
  }
  if (status === 'success') return <div className="form-success" role="status"><span className="success-icon"><Check size={31}/></span><h3>{t.contactDoneTitle}</h3><p>{t.contactDoneBody}</p><button className="underlined" onClick={() => setStatus('idle')}>{t.contactAgain} <ArrowUpRight size={18}/></button></div>;
  return <form className="contact-form" onSubmit={submit} aria-label={t.contactLabel}><Honeypot/><div className="form-row"><label>{t.name}<input name="name" placeholder={t.namePlaceholder} required maxLength={80} autoComplete="name"/></label><label>{t.company}<input name="company" placeholder={t.companyPlaceholder} maxLength={120} autoComplete="organization"/></label></div><label>Email<input type="email" name="email" placeholder={t.emailPlaceholder} required maxLength={254} autoComplete="email"/></label><label>{t.topic}<select name="topic" defaultValue="" required><option value="" disabled>{t.topicPlaceholder}</option>{TOPICS.map(topic => <option key={topic} value={topic}>{t.topics[topic] ?? topic}</option>)}</select></label><label>{t.idea}<textarea name="message" placeholder={t.ideaPlaceholder} required minLength={10} maxLength={3000} rows={4}/></label><label className="consent"><input type="checkbox" name="consent" required/><Consent parts={t.contactConsent} locale={locale}/></label><div className="form-bottom"><p className="form-error" role="alert">{error}</p><Submit status={status} locale={locale}>{t.contactSubmit}</Submit></div></form>;
}
export function NewsletterForm({locale = 'zh-TW'}: {locale?: Locale}) {
  const t = dictionary(locale).forms;
  const [status, setStatus] = useState<Status>('idle'), [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (status === 'sending') return;
    const form = event.currentTarget; setStatus('sending'); setError('');
    try { await send('/api/subscribe', form, locale); setStatus('success'); form.reset(); } catch (e) { setError(e instanceof Error ? e.message : t.network); setStatus('error'); }
  }
  if (status === 'success') return <div className="newsletter-success" role="status"><Check size={30}/><div><h3>{t.newsletterDoneTitle}</h3><p>{t.newsletterDoneBody}</p></div></div>;
  return <form className="newsletter-form" onSubmit={submit} aria-label={t.newsletterLabel}><Honeypot/><div className="newsletter-fields"><label className="sr-only" htmlFor="newsletter-email">{t.newsletterEmail}</label><input id="newsletter-email" name="email" type="email" autoComplete="email" maxLength={254} placeholder={t.newsletterEmail} required/><Submit status={status} locale={locale}>{t.newsletterSubmit}</Submit></div><label className="consent"><input type="checkbox" name="consent" required/><Consent parts={t.newsletterConsent} locale={locale}/></label><p className="form-error" role="alert">{error}</p></form>;
}
export function UnsubscribeForm({token}: {token: string}) {
  const [status, setStatus] = useState<Status>('idle'), [error, setError] = useState('');
  async function unsubscribe() { setStatus('sending'); try {const response = await fetch('/api/unsubscribe', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({token})}); const result = await response.json() as {error?: string}; if (!response.ok) throw new Error(result.error); setStatus('success');} catch(e){setError(e instanceof Error ? e.message : '請稍後重試。');setStatus('error');} }
  return <div>{status === 'success' ? <p role="status">已完成退訂。謝謝你曾經一起保持好奇。</p> : <><p>確認後，這個信箱將不再收到人蔘電子報。</p><button className="button primary" onClick={unsubscribe} disabled={status === 'sending' || !token}>{status === 'sending' ? '處理中…' : '確認退訂'}</button><p className="form-error" role="alert">{error || (!token ? '請使用電子報中的完整退訂連結。' : '')}</p></>}</div>;
}
export function ConfirmSubscription({token, locale = 'zh-TW'}: {token: string; locale?: Locale}) {
  const t = dictionary(locale).newsletter;
  const [status, setStatus] = useState<Status>('idle'), [error, setError] = useState('');
  async function confirm() {
    setStatus('sending'); setError('');
    try {
      const response = await fetch('/api/newsletter/confirm', {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Site-Locale': locale}, body: JSON.stringify({token})});
      const result = await response.json() as {error?: string};
      if (!response.ok) throw new Error(result.error);
      setStatus('success');
    } catch (e) { setError(e instanceof Error && e.message ? e.message : dictionary(locale).forms.network); setStatus('error'); }
  }
  // A button instead of confirming on page load: mail scanners open links, and only a person should confirm.
  if (status === 'success') return <p className="confirm-done" role="status"><Check size={22}/>{t.confirmDone}</p>;
  return <div><p>{t.confirmBody}</p><button className="button primary" onClick={confirm} disabled={status === 'sending' || !token}>{status === 'sending' ? t.confirmWorking : t.confirmButton}</button><p className="form-error" role="alert">{error || (!token ? t.confirmMissing : '')}</p></div>;
}
