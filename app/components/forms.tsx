'use client';
import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Check, LoaderCircle } from 'lucide-react';
import { TOPICS } from '@/lib/validation';

type Status = 'idle' | 'sending' | 'success' | 'error';
async function send(url: string, form: HTMLFormElement) {
  const fields = Object.fromEntries(new FormData(form));
  const response = await fetch(url, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...fields, consent: fields.consent === 'on'})});
  const result = await response.json() as {error?: string};
  if (!response.ok) throw new Error(result.error || '送出失敗，請稍後再試。');
}
function Honeypot() { return <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>; }
function Submit({status, children, className = ''}: {status: Status; children: React.ReactNode; className?: string}) { return <button className={`button primary ${className}`} disabled={status === 'sending'} type="submit">{status === 'sending' ? <><LoaderCircle className="spin" size={18}/>送出中</> : <>{children}<ArrowUpRight size={19}/></>}</button>; }
export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle'), [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (status === 'sending') return;
    const form = event.currentTarget; setStatus('sending'); setError('');
    try { await send('/api/contact', form); setStatus('success'); form.reset(); } catch (e) { setError(e instanceof Error ? e.message : '連線失敗，請稍後重試。'); setStatus('error'); }
  }
  if (status === 'success') return <div className="form-success" role="status"><span className="success-icon"><Check size={31}/></span><h3>點子，接住了。</h3><p>合作需求已儲存。人蔘會透過你留下的 Email 聯繫你。</p><button className="underlined" onClick={() => setStatus('idle')}>再聊另一個點子 <ArrowUpRight size={18}/></button></div>;
  return <form className="contact-form" onSubmit={submit} aria-label="商業合作表單"><Honeypot/><div className="form-row"><label>怎麼稱呼你<input name="name" placeholder="你的名字" required maxLength={80} autoComplete="name"/></label><label>公司 / 品牌（選填）<input name="company" placeholder="公司或品牌名稱" maxLength={120} autoComplete="organization"/></label></div><label>Email<input type="email" name="email" placeholder="you@company.com" required maxLength={254} autoComplete="email"/></label><label>想聊什麼？<select name="topic" defaultValue="" required><option value="" disabled>請選擇合作類型</option>{TOPICS.map(topic => <option key={topic}>{topic}</option>)}</select></label><label>你的想法<textarea name="message" placeholder="簡單說說你的需求、時間與期待。（至少 10 字）" required minLength={10} maxLength={3000} rows={4}/></label><label className="consent"><input type="checkbox" name="consent" required/><span>同意依<a href="/privacy" target="_blank" rel="noopener noreferrer">隱私說明</a>使用資料，僅用於回覆這次洽談。</span></label><div className="form-bottom"><p className="form-error" role="alert">{error}</p><Submit status={status}>送出合作提案</Submit></div></form>;
}
export function NewsletterForm() {
  const [status, setStatus] = useState<Status>('idle'), [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (status === 'sending') return;
    const form = event.currentTarget; setStatus('sending'); setError('');
    try { await send('/api/subscribe', form); setStatus('success'); form.reset(); } catch (e) { setError(e instanceof Error ? e.message : '連線失敗，請稍後重試。'); setStatus('error'); }
  }
  if (status === 'success') return <div className="newsletter-success" role="status"><Check size={30}/><div><h3>你已加入人蔘的名單。</h3><p>第一封信準備好時，我們信箱見。</p></div></div>;
  return <form className="newsletter-form" onSubmit={submit} aria-label="電子報訂閱"><Honeypot/><div className="newsletter-fields"><label className="sr-only" htmlFor="newsletter-email">你的 Email</label><input id="newsletter-email" name="email" type="email" autoComplete="email" maxLength={254} placeholder="你的 Email" required/><Submit status={status}>訂閱</Submit></div><label className="consent"><input type="checkbox" name="consent" required/><span>我同意接收人蔘電子報，並已閱讀<a href="/privacy" target="_blank" rel="noopener noreferrer">隱私說明</a>。</span></label><p className="form-error" role="alert">{error}</p></form>;
}
export function UnsubscribeForm({token}: {token: string}) {
  const [status, setStatus] = useState<Status>('idle'), [error, setError] = useState('');
  async function unsubscribe() { setStatus('sending'); try {const response = await fetch('/api/unsubscribe', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({token})}); const result = await response.json() as {error?: string}; if (!response.ok) throw new Error(result.error); setStatus('success');} catch(e){setError(e instanceof Error ? e.message : '請稍後重試。');setStatus('error');} }
  return <div>{status === 'success' ? <p role="status">已完成退訂。謝謝你曾經一起保持好奇。</p> : <><p>確認後，這個信箱將不再收到人蔘電子報。</p><button className="button primary" onClick={unsubscribe} disabled={status === 'sending' || !token}>{status === 'sending' ? '處理中…' : '確認退訂'}</button><p className="form-error" role="alert">{error || (!token ? '請使用電子報中的完整退訂連結。' : '')}</p></>}</div>;
}
