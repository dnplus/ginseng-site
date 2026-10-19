import { headers } from 'next/headers';
import { env } from 'cloudflare:workers';
import { database } from '@/lib/server';
import { isStudioOwner } from '@/lib/access-auth';
import { ArrowLeft, Download } from 'lucide-react';
export const dynamic = 'force-dynamic';
export const metadata = {title:'私人管理工作站｜人蔘 Try Catch',robots:{index:false,follow:false}};
const time = (value: string) => new Intl.DateTimeFormat('zh-TW',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Taipei'}).format(new Date(value));
export default async function Studio() {
  if (!await isStudioOwner(await headers(), env)) return <main className="subpage"><a href="/">回首頁</a><h1>人蔘的私人工作站</h1><p>目前無法確認你的存取權限。請使用網站擁有者的帳號，透過 Cloudflare Access 驗證後再進入。</p><a href="/studio" className="button primary">重新開啟工作站</a></main>;
  const db = database();
  const [subscribers, inquiries, countSubs, countInquiries] = await Promise.all([
    db.prepare('SELECT email, status, created_at FROM subscribers ORDER BY created_at DESC LIMIT 100').all<{email:string;status:string;created_at:string}>(),
    db.prepare('SELECT name, email, company, topic, message, created_at, notification_status FROM inquiries ORDER BY created_at DESC LIMIT 50').all<{name:string;email:string;company:string;topic:string;message:string;created_at:string;notification_status:string}>(),
    db.prepare("SELECT COUNT(*) as count FROM subscribers WHERE status = 'active'").first<{count:number}>(),
    db.prepare('SELECT COUNT(*) as count FROM inquiries').first<{count:number}>(),
  ]);
  return <main className="admin"><header><div><p className="section-index">GINSENG / PRIVATE STUDIO</p><h1>人蔘的管理工作站</h1></div><a href="/" className="underlined"><ArrowLeft size={17}/>回首頁</a></header><div className="admin-note">表單資料會保存於此。電子報寄送服務尚未串接；目前可匯出有效訂閱名單，CSV 含每位訂閱者的退訂網址。寄送時請保留退訂入口。合作詢問會透過 Cloudflare 寄至 dnplus@mail.grokbot.com，通知狀態顯示於各筆需求下方。</div><section className="admin-section"><div className="admin-section-head"><h2>電子報訂閱 · {countSubs?.count ?? 0} 位有效</h2><a className="button primary" href="/api/studio/export?kind=subscribers"><Download size={16}/>匯出有效名單</a></div>{subscribers.results.length ? <div className="table-scroll"><table><thead><tr><th>Email</th><th>狀態</th><th>加入時間</th></tr></thead><tbody>{subscribers.results.map(row => <tr key={row.email}><td>{row.email}</td><td>{row.status === 'active' ? '訂閱中' : '已退訂'}</td><td>{time(row.created_at)}</td></tr>)}</tbody></table><p className="mono">顯示最近 100 筆；匯出包含全部有效訂閱。</p></div> : <p className="empty">還沒有訂閱者。第一位好奇鬼正在路上。</p>}</section><section className="admin-section"><div className="admin-section-head"><h2>合作詢問 · {countInquiries?.count ?? 0} 筆</h2><a className="button primary" href="/api/studio/export?kind=inquiries"><Download size={16}/>匯出合作需求</a></div>{inquiries.results.length ? inquiries.results.map((row, index) => <article className="inquiry" key={index}><header><strong>{row.name}{row.company ? ` / ${row.company}` : ''} · {row.topic}</strong><time>{time(row.created_at)}</time></header><p><a className="underlined" href={`mailto:${row.email}`}>{row.email}</a></p><p>{row.message}</p><p className="mono">Email 通知：{row.notification_status === 'accepted' ? 'Cloudflare 已接受寄送' : row.notification_status === 'failed' ? '寄送失敗，請手動處理此需求' : '尚未確認寄送'}</p></article>) : <p className="empty">還沒有合作詢問。有人丟來點子時，會出現在這裡。</p>}<p className="mono">顯示最近 50 筆；匯出包含全部合作需求。</p></section></main>;
}
