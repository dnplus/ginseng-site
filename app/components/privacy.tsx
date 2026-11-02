import { ArrowLeft } from 'lucide-react';
import { localePath, type Locale } from '@/lib/i18n';

const zh = <>
  <h1>你的資料，只用在說好的地方。</h1><p>更新日期：2026 年 11 月 1 日</p>
  <h2>電子報訂閱</h2><p>我們記錄你的 Email、訂閱狀態、訂閱時間、你訂閱時使用的網站語言、訂閱來源與同意版本，用於寄送人蔘的 AI 工具、技術實作與工作靈感電子報，並依語言寄送對應版本。訂閱是自願的，不影響你瀏覽本站。</p>
  <p>訂閱採雙重確認：送出表單後，我們會寄一封確認信到你填寫的信箱，你點信中的連結確認後，訂閱才會生效，並記錄確認時間。沒有確認的信箱不會收到電子報；確認連結 7 天後失效。確認信透過 Cloudflare Email Service 寄送。</p>
  <h2>商業合作與聯繫</h2><p>合作表單會儲存你提供的姓名、Email、公司或品牌（選填）、合作類型與需求內容，僅用於評估及回覆這次洽談。合作內容也會透過 Cloudflare Email Service 寄送至管理者的 GrokBot 信箱，供整理及回覆本次需求。送出合作表單不會自動訂閱電子報。請不要在表單填入密碼、機敏文件或不必要的個人資料。</p>
  <h2>資料保存與管理</h2><p>資料儲存在本站使用的雲端資料庫，僅供網站管理者處理訂閱與聯繫。為避免垃圾訊息，本站會暫時記錄經雜湊的連線識別及送出次數，不保存原始 IP。這些限制紀錄會在到期後於後續請求清理。</p>
  <p>本站不會販售你的個人資料。電子報資料保存至退訂或提出刪除要求；退訂後保留必要的退訂狀態以避免再次寄送。合作資訊於需求處理及必要的後續聯繫期間保留。</p>
  <h2>退訂、查詢與刪除</h2><p>每封電子報都附退訂連結，點選後確認即可停止接收；支援的郵件服務（例如 Gmail）也可以直接使用信箱介面的「取消訂閱」按鈕一鍵退訂。如需查詢、更正或刪除資料，請透過<a href="/#contact">合作聯繫表單</a>說明需求，並提供原先使用的 Email 供核對。</p>
  <h2>外部網站與登入</h2><p>YouTube、Threads、Genio One 等外部網站依各自的隱私規範運作。本站字型由 Google Fonts 提供，影片縮圖直接從 YouTube 載入；瀏覽頁面時，你的瀏覽器會向這些服務請求檔案。本網站的管理功能使用 Cloudflare Access 驗證管理者身分，訪客送出表單時不會取得其他人的資料。本站未加入廣告追蹤程式。</p>
</>;

const en = <>
  <h1>Your data, used only where we said.</h1><p>Last updated: November 1, 2026</p>
  <h2>Newsletter</h2><p>We store your email address, subscription status, signup time, the site language you subscribed from, where you subscribed, and the consent version. We use them to send the Ginseng Try Catch newsletter about AI tools, hands-on engineering and work ideas, in your language. Subscribing is optional and does not affect browsing this site.</p>
  <p>Subscriptions use double opt-in: after you submit the form we email a confirmation link to that address, and the subscription starts only when you click it; we record when you confirmed. Unconfirmed addresses receive no newsletter, and confirmation links expire after 7 days. Confirmation emails are sent with Cloudflare Email Service.</p>
  <h2>Collaboration inquiries</h2><p>The collaboration form stores your name, email, company or brand (optional), topic and message, used only to evaluate and reply to that inquiry. The inquiry is also delivered with Cloudflare Email Service to the site owner's GrokBot inbox for follow-up. Sending the form does not subscribe you to the newsletter. Please do not include passwords, confidential documents or personal data that is not needed.</p>
  <h2>Storage</h2><p>Data is kept in this site's cloud database and is only used by the site owner to handle subscriptions and inquiries. To prevent spam, the site briefly keeps a hashed connection identifier and submission count, never the raw IP address; these records are cleared after they expire.</p>
  <p>We never sell your personal data. Newsletter data is kept until you unsubscribe or ask for deletion; after unsubscribing we keep only what is needed to avoid emailing you again. Inquiry data is kept while the inquiry and any needed follow-up are handled.</p>
  <h2>Unsubscribe, access and deletion</h2><p>Every newsletter has an unsubscribe link. Mail apps that support it (such as Gmail) also offer a one-click unsubscribe button. To access, correct or delete your data, use the <a href="/en#contact">contact form</a> and include the email address you used.</p>
  <h2>Third parties and sign-in</h2><p>YouTube, Threads, Genio One and other external sites follow their own privacy policies. Fonts are served by Google Fonts and video thumbnails load directly from YouTube, so your browser requests files from those services. The site's admin area is protected by Cloudflare Access, and visitors submitting forms cannot see anyone else's data. This site has no advertising trackers.</p>
  <p>The Mandarin version of this notice is the original; if the two differ, the Mandarin version applies.</p>
</>;

export function PrivacyPage({locale}: {locale: Locale}) {
  return <main className="subpage"><a href={localePath(locale, '/')}><ArrowLeft size={17}/>{locale === 'en' ? 'Back to home' : '回到人蔘的工作站'}</a>{locale === 'en' ? en : zh}</main>;
}
