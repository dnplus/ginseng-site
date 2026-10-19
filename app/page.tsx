import { ArrowUpRight, Coffee, Menu, Play, Terminal, PlaySquare, MessageCircle, Camera } from 'lucide-react';
import { ContactForm, NewsletterForm } from './components/forms';
import { CHANNEL_URL, latestVideos, thumbnail, watchUrl, type Video } from '@/lib/youtube';

export const dynamic = 'force-dynamic';

const views = new Intl.NumberFormat('zh-TW');
const relative = new Intl.RelativeTimeFormat('zh-TW', {numeric: 'auto'});
function ago(iso: string) {
  const hours = (Date.parse(iso) - Date.now()) / 3_600_000;
  if (hours > -24) return relative.format(Math.min(-1, Math.round(hours)), 'hour');
  const days = Math.round(hours / 24);
  if (days > -14) return relative.format(days, 'day');
  if (days > -60) return relative.format(Math.round(days / 7), 'week');
  return relative.format(Math.round(days / 30), 'month');
}
const meta = (video: Video) => [ago(video.published), video.views === null ? null : `${views.format(video.views)} 次觀看`].filter(Boolean).join('，');
const external = {target: '_blank', rel: 'noopener noreferrer'} as const;

function Plaque() {
  return <span className="plaque"><b>人蔘</b> TRY CATCH</span>;
}

export default async function Home() {
  const videos = await latestVideos();
  const [featured, ...rest] = videos;
  const list = rest.slice(0, 4);
  const shown = [featured, ...list];
  const popular = shown.every(video => video.views !== null) ? shown.reduce((top, video) => (video.views! > top.views! ? video : top)) : null;

  return <>
    <a className="skip-link" href="#main">跳到主要內容</a>
    <div className="stage">
      <div className="panel">
        <header className="header">
          <a href="/" aria-label="人蔘 Try Catch 首頁"><Plaque/></a>
          <nav className="desktop-nav" aria-label="主要導覽"><a href="#projects">專案</a><a href="#videos">影片</a><a href="#about">關於我</a><a href="#contact">合作</a><a className="nav-cta" href="#newsletter">訂閱電子報</a></nav>
          <details className="mobile-menu"><summary aria-label="開啟導覽"><Menu size={24}/></summary><nav aria-label="手機導覽"><a href="#projects">專案</a><a href="#videos">影片</a><a href="#about">關於我</a><a href="#contact">合作</a><a href="#newsletter">訂閱電子報</a></nav></details>
        </header>
        <main id="main" className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="hello">嗨，我是人蔘。</p>
            <h1 id="hero-title">把好奇心，<br/><span className="hero-highlight">做成有用的東西。</span></h1>
            <p className="hero-lead">技術主管，也是每天在 Try…Catch 裡打滾的創作者。研究 AI，把它放進真實工作，再把踩過的坑整理給你。</p>
            <div className="hero-actions">
              <a className="button primary" href="#videos">看最新影片 <ArrowUpRight size={19}/></a>
              <a className="button ghost" href="#contact">聊聊合作</a>
            </div>
            <nav className="hero-socials" aria-label="追蹤人蔘的社群帳號">
              <a href={CHANNEL_URL} {...external}><PlaySquare size={17}/>YouTube <span>@GinsengTryCatch</span><ArrowUpRight size={14}/></a>
              <a href="https://www.threads.com/@ginsengtrycatch" {...external}><MessageCircle size={17}/>Threads <span>@ginsengtrycatch</span><ArrowUpRight size={14}/></a>
              <a href="https://www.instagram.com/ginsengtrycatch/" {...external}><Camera size={17}/>Instagram <span>@ginsengtrycatch</span><ArrowUpRight size={14}/></a>
            </nav>
            <a className="fresh" href={watchUrl(featured.id)} {...external}>
              <img src={thumbnail(featured.id, 'mqdefault')} alt="" width="320" height="180" loading="lazy"/>
              <span><small>剛上片・{ago(featured.published)}</small>{featured.title}</span>
            </a>
          </div>
          <div className="mascot" aria-hidden="true">
            <span className="note">本人，大概長這樣<svg viewBox="0 0 60 30" aria-hidden="true"><path d="M3 22C17 8 36 6 55 14M55 14l-11-7M55 14l-12 4"/></svg></span>
            <img src="/assets/ginseng-cutout.webp" alt="" width="900" height="900" fetchPriority="high"/>
          </div>
        </main>
      </div>
    </div>

    <section className="projects" id="projects" aria-labelledby="projects-title">
      <div className="wrap">
        <p className="section-sticker">親手做的東西</p>
        <h2 id="projects-title">最近在做的事</h2>
        <p className="projects-intro">把 AI 放進產品與工作裡，一邊做，一邊分享實作過程。</p>
        <article className="project project-pa">
          <span className="project-icon"><Coffee size={28}/></span>
          <div><p className="project-kicker">個人專案 · Agent 協作小屋</p><h3>PA Cafe</h3><p>替 AI Agent 開一間咖啡廳。把任務、協作與工作狀態，放進有角色、有生活感的小屋裡，探索和 Agent 一起工作的方式。</p></div>
          <div className="project-links"><a className="button primary" href="https://pacafe.dnplus.dev" {...external}>逛逛 PA Cafe <ArrowUpRight size={17}/></a><a className="quiet-link" href={watchUrl('tbj0Azzlguw')} {...external}>看 PA Cafe 開發日誌</a></div>
        </article>
        <article className="project">
          <span className="project-icon"><Terminal size={26}/></span>
          <div><p className="project-kicker">企業 AI 實作</p><h3>Genio One</h3><p>從 AI 代理到企業存取治理，把實驗往真實工作再推進一步。</p></div>
          <div className="project-links"><a className="pill-link" href="https://genio.sh" {...external}>看看專案 <ArrowUpRight size={17}/></a><a className="quiet-link" href={watchUrl('bvRPXARAK0A')} {...external}>看我聊這個實驗</a></div>
        </article>
      </div>
    </section>

    <section className="videos" id="videos" aria-labelledby="videos-title">
      <div className="wrap">
        <div className="videos-head">
          <div><p className="section-sticker">創作與實驗</p><h2 id="videos-title">最近的影片</h2><p>AI 工具實測、Agent 工作流，還有產業的一些觀察。新片上架，這裡就會跟著更新。</p></div>
          <a className="pill-link" href={CHANNEL_URL} {...external}>YouTube 頻道 <ArrowUpRight size={17}/></a>
        </div>
        <div className="videos-grid">
          <a className="feature" href={watchUrl(featured.id)} {...external}>
            <span className="thumb"><img src={thumbnail(featured.id)} alt="" width="1280" height="720" loading="lazy"/><i className="play"><Play size={26} fill="currentColor"/></i>{popular?.id === featured.id && <em className="tag">這支最多人看</em>}</span>
            <span className="meta">{meta(featured)}</span>
            <h3>{featured.title}</h3>
            {featured.summary && <p>{featured.summary}</p>}
          </a>
          <ul className="video-list">
            {list.map(video => <li key={video.id}><a href={watchUrl(video.id)} {...external}>
              <span className="thumb"><img src={thumbnail(video.id, 'mqdefault')} alt="" width="320" height="180" loading="lazy"/></span>
              <span><h3>{video.title}</h3><span className="meta">{meta(video)}</span>{popular?.id === video.id && <em className="tag">這支最多人看</em>}</span>
            </a></li>)}
          </ul>
        </div>

      </div>
    </section>

    <section className="about" id="about" aria-labelledby="about-title">
      <div className="wrap about-grid">
        <div className="about-copy">
          <p className="section-sticker">關於人蔘</p>
          <h2 id="about-title">一半技術人，<br/>一半好奇鬼。</h2>
          <p className="lead">喜歡把複雜的事情拆開，再重新組成好用的東西。</p>
          <p>我的工作哲學是「精準省力」：先問對問題，再挑工具。不為了技術而技術，也不把忙碌當成成就。</p>
          <p>在頻道裡，我分享 AI Agent 實測、工程實戰與職場觀察。把技術玩明白，把時間省下來，留給真正有意思的事。</p>
        </div>
        <figure className="code-card">
          <div className="code-bar" aria-hidden="true"><i/><i/><i/><span>life.ts</span></div>
          <pre aria-hidden="true"><code>{[
            <><span className="k">try</span> {'{'}</>,
            <>  <span className="f">過日子</span>();</>,
            <>{'}'} <span className="k">catch</span> (e) {'{'}</>,
            <>  <span className="c">{'// 下一秒會拋出什麼，沒人知道'}</span></>,
            <>  <span className="f">接住</span>(e);</>,
            <>{'}'}</>,
          ].map((line, index) => <span className="line" key={index}>{line}</span>)}</code></pre>
          <figcaption>人生就像 Try…Catch，你永遠不知道下一秒會拋出什麼 Exception，反正 Catch 住就對了。</figcaption>
        </figure>
      </div>
    </section>

    <section className="contact" id="contact" aria-labelledby="contact-title">
      <div className="wrap contact-grid">
        <div className="contact-copy">
          <p className="section-sticker">合作聊聊</p>
          <h2 id="contact-title">有個點子？<br/>一起試試。</h2>
          <p className="lead">品牌合作、企業分享、AI 工具實作。如果你也喜歡把事情做得更聰明，歡迎聊聊。</p>
          <dl className="services">
            <div><dt>內容與品牌合作</dt><dd>產品實測、內容企劃、技術觀點分享。一起找出對觀眾有用的切入點。</dd></div>
            <div><dt>企業分享與工作坊</dt><dd>從 AI 工具、Agent 工作流到工程實務，把抽象概念變成可以動手的內容。</dd></div>
            <div><dt>產品交流與實作</dt><dd>有技術卡點或新產品構想？聊聊現況、目標，以及值得先做的小實驗。</dd></div>
          </dl>
        </div>
        <div className="form-card"><ContactForm/></div>
      </div>
    </section>

    <section className="newsletter" id="newsletter" aria-labelledby="newsletter-title">
      <div className="wrap newsletter-inner">
        <div><h2 id="newsletter-title">好用的，留給你。</h2><p>訂閱人蔘電子報，收到值得試的 AI 工具與工作靈感。不定期寄送，隨時都能退訂。</p></div>
        <NewsletterForm/>
      </div>
    </section>

    <footer className="footer">
      <div className="wrap footer-inner">
        <div><a href="/" aria-label="人蔘 Try Catch 首頁"><Plaque/></a><p>少一點內捲，多一點外掛。</p></div>
        <nav aria-label="社群與網站資訊"><a href={CHANNEL_URL} {...external}>YouTube</a><a href="https://www.threads.com/@ginsengtrycatch" {...external}>Threads</a><a href="https://www.instagram.com/ginsengtrycatch/" {...external}>Instagram</a><a href="/privacy">隱私說明</a><span>© 2026 Ginseng Try Catch</span></nav>
      </div>
    </footer>
  </>;
}
