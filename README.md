# 人蔘 Try Catch

[GitHub 原始碼](https://github.com/dnplus/ginseng-site)

已部署：[ginseng.dnplus.dev](https://ginseng.dnplus.dev) · [Workers 預覽](https://ginseng-try-catch.dnplus.workers.dev)。

2026-10-19 已建立專用 D1 並套用 migrations。首頁與表單可公開使用；目前 `CF_ACCESS_AUD` 未設定，後台頁面與匯出一律拒絕存取，等待具備 Access 管理權限後再開通管理者登入。

從 ChatGPT Sites 完整下載後，改成獨立的 Cloudflare Workers 專案。保留原網站畫面、圖片、合作表單、電子報訂閱、退訂、管理工作站與 CSV 匯出。

使用既有 Vinext / React / Cloudflare Vite plugin，在 Workers 執行 SSR 與 API；D1 保存訂閱、合作詢問和短期限流紀錄。後台使用 Cloudflare Access JWT 驗證。Sites 的登入、連接器和建置腳本已移除。

## 本地執行

需要 Node.js 22.13 以上與 pnpm 11.25.0（package.json 已固定版本）。

```bash
pnpm install --frozen-lockfile
cp .dev.vars.example .dev.vars
pnpm db:migrate
pnpm dev
```

開啟 http://localhost:5173。D1 資料保存在 `.wrangler/state`；本地表單可直接測試。未配置有效的 Cloudflare Access 身分時，`/studio` 不讀取資料，匯出 API 拒絕存取。本地沒有假登入。

若 5173 已被其他服務使用，可執行 `pnpm dev --port 5180` 或 `pnpm preview --port 5180`，並以 `pnpm test:smoke http://127.0.0.1:5180` 測試該網址。

```bash
pnpm check
pnpm test
pnpm build
pnpm preview
# 在另一個終端機執行；會使用並清理合成測試資料
pnpm test:smoke
```

`pnpm preview` 執行正式建置產物，使用相同的本地 D1。Smoke test 會驗證頁面、圖片、表單寫入與讀回、重複訂閱、退訂、Origin/同意檢查、限流及匯出權限。JWT 測試使用合成金鑰驗證有效與無效憑證。

## 部署到你的 Cloudflare 帳戶

1. 執行 `pnpm exec wrangler login`，再以 `pnpm exec wrangler whoami` 確認帳戶。
2. 本專案已綁定 `ginseng-try-catch` D1。若部署到其他帳號，先執行 `pnpm db:create`，再將新的 D1 UUID 填入 `wrangler.jsonc` 的 `d1_databases[0].database_id`。
3. 在 Cloudflare Zero Trust 建立 Self-hosted Access application，使用同一 application 保護實際部署主機上的 `/studio`、`/studio/*`、`/api/studio/*`，Allow policy 限制為管理者 Email。如果使用 workers.dev 和自訂網域，必須各自加入對應 hostname/path。
4. 在 `wrangler.jsonc` 設定 `SITE_URL` 為實際 HTTPS 網址、`CF_ACCESS_TEAM_DOMAIN` 為完整的 `https://<team>.cloudflareaccess.com`、`CF_ACCESS_AUD` 為該 application 的 AUD。
5. 執行 `pnpm exec wrangler secret put STUDIO_OWNER_EMAIL`，輸入允許管理後台的 Email。不可放在前端程式或提交到 Git 的檔案。
6. 執行 `pnpm db:migrate:remote` 建立遠端資料表，再執行 `pnpm deploy`。部署指令會重新 build，確保最新 D1 與環境設定寫入建置。

替換 D1 UUID 也會改變本地資料庫識別；之後繼續本地開發前請再執行 `pnpm db:migrate`，舊的本地測試資料不會自動移入新識別的資料庫。

`pnpm deploy:dry-run` 只產生部署檢核產物。穩定預覽使用 `ginseng-try-catch.dnplus.workers.dev`；`preview_urls`（每版額外產生的網址）保持關閉，避免增加未受 Access 保護的後台入口。

JWT 驗證會檢查 Cloudflare 公開金鑰簽章、issuer、AUD、有效期限及管理者 Email；不接受 caller 提供的 Email 或 Sites 登入標頭。設定缺漏或驗證失敗時後台一律拒絕，管理頁及匯出回應不會被快取。

## 資料與功能

- `/`：個人介紹、PA Cafe、你的 AI 夥伴風格指南、Genio One、YouTube／Threads／Instagram、合作聯繫及電子報。影片區由 Worker 讀取頻道 RSS；RSS 無法使用時讀取 YouTube 公開影片頁（`lib/youtube.ts`），每個 isolate 快取 15 分鐘；兩個來源都無法取得時會標示並顯示內建清單（最近更新：2026-10-19；備用清單不顯示觀看次數）。Nunito Sans 由本站提供，Noto Sans TC 來自 Google Fonts，影片縮圖來自 i.ytimg.com。
- `/en`：英文首頁。多語系規則：預設語言（繁中）在根目錄，其他語言加路徑前綴，避免既有網址與影片 QR code 失效；`lib/i18n.ts` 管理語系、路徑與介面字典，每頁用 `lib/metadata.ts` 輸出 canonical 與 `hreflang`（只列該頁實際存在的語言）。`worker.ts` 依路徑設定 `<html lang>`，不依瀏覽器語言自動轉址，改由頁首語言切換。
- `/lab`、`/en/lab`：實驗室，列出產品與小工具；新工具加到 `lib/site.ts` 的 `LAB`。
- `/community`、`/en/community`：Discord 社群介紹；`lib/site.ts` 的 `DISCORD_INVITE_URL` 設定後顯示加入按鈕，未設定時顯示「即將開放」並導向電子報。X 帳號開通後填入 `X_ACCOUNT`，英文頁會優先顯示。
- `/blog`、`/blog/<slug>`、`/en/blog`：部落格。文章是 `content/posts/<語系>/<slug>.md`（front matter 欄位見 `lib/blog.ts`），建置時打包進 Worker；翻譯版用同一個 slug 放到另一個語系資料夾，頁面會自動互相連結並輸出 `hreflang`。`draft: true` 只在 `pnpm dev` 顯示。
  - 從 Notion 搬文章（在 `ntn whoami` 已登入的機器）：`node scripts/import-notion.mjs <Notion 網址> --slug ep082 --date 2026-10-25 --episode 82 --youtube <影片 id>`，圖片會下載到 `public/blog/<slug>/`。
  - 從 ARS 集數產生草稿：`node --experimental-strip-types scripts/episode-to-post.mjs <ARS>/src/episodes/ginseng-channel/ep087/episode.ts --youtube <id> --date <首播日>`。
- `/ep/<集數>`：影片 QR code 與說明欄用的固定短網址（`/ep/87`、`/ep/087`、`/ep/EP087` 都可）。本站有該集文章就導過去，否則導到 `lib/episodes.ts` 的 Notion 舊文，再不然導到文章列表；用 302，搬家後同一個短網址自動換目的地。已發布的 Notion 頁面請保留，舊影片的 QR code 仍指向它們。
- `/feed.xml`、`/en/feed.xml`：各語系 RSS；`/sitemap.xml` 含各語系 `hreflang`。
- `/studio`：管理工作站，顯示最近資料並可匯出 CSV。
- `/unsubscribe?token=...`：確認退訂；每位訂閱者的網址包含於 CSV。
- `/privacy`：資料使用說明。
- `migrations/0001_initial.sql`：D1 初始 schema。

這次下載取得原始碼與靜態資產，**不包含 Sites 正式 D1 的訂閱者或合作紀錄**。新的 D1 從空資料表開始。原 Sites 的發布與存取設定沒有更動。

電子報採雙重確認（double opt-in，migration `0003`）：表單送出後訂閱者為 `pending`，系統以 `NEWSLETTER_EMAIL` binding（只允許 `ginseng@dnplus.dev` 寄件、不限收件人）寄確認信，點 `/newsletter/confirm` 的按鈕後才變成 `active`；連結 7 天有效，同一信箱 10 分鐘內不重寄。舊的 single opt-in 訂閱者維持 `active`。訂閱者會記錄語言（`locale`）與來源（`source`）。

本站自己寄的信（確認信）都帶 `lib/newsletter-email.ts` 的 `listUnsubscribeHeaders()`（RFC 8058 一鍵退訂，目標是 `/api/unsubscribe/one-click`）。

### 用 Resend 群發

D1 是訂閱名單的唯一來源；確認後的訂閱者同步成 Resend 聯絡人（中、英各一個 segment），用 Resend 行銷方案（以聯絡人數計費）寄 broadcast。

1. 在 Resend 驗證寄件網域 `dnplus.dev`（寄件人 `ginseng@dnplus.dev`），建立兩個 segment，把 id 填入 `wrangler.jsonc` 的 `RESEND_SEGMENT_ZH_TW`、`RESEND_SEGMENT_EN`。
2. `pnpm exec wrangler secret put RESEND_API_KEY`（需要 contacts 與 broadcasts 權限）。
3. 在 Resend 建 webhook 指向 `https://<網域>/api/webhooks/resend`，勾選 `contact.updated` 與 `email.complained`，把 signing secret 存成 `RESEND_WEBHOOK_SECRET`。在 Resend 退訂或檢舉垃圾信的人，會同步改成本站退訂。
4. `pnpm db:migrate:remote` 套用 `0004`，部署後到 `/studio` 按「同步名單」補同步既有訂閱者（每次 15 筆，可重按）。之後確認、退訂都會即時同步，失敗的留在待同步。
5. 寫電子報：在 `content/newsletters/<語系>/<slug>.md` 新增一期（格式同文章，路徑用站內相對路徑即可，寄出時會轉成絕對網址），部署後在 `/studio` 按「建立 Resend 草稿」。**本站只建草稿**，到 Resend 寄測試信、確認後再發送。信尾自動帶網頁版連結與 Resend 退訂連結。

後台 CSV 匯出仍含語言、退訂網址與一鍵退訂網址。歷期電子報放在 `content/newsletters/<語系>/<slug>.md`（格式同文章），顯示於 `/newsletter`。

API 錯誤訊息依表單送出的 `X-Site-Locale` 回傳中文或英文（`lib/messages.ts`）；隱私說明有 `/privacy` 與 `/en/privacy`。

## 視覺識別

網站與 [PA Cafe](https://pacafe.dnplus.dev) 及 ARS EP078 的 D 版「活潑咖啡廳」對齊：森林綠 `#263f35`、奶油底 `#fff4e2`、蜜桃 `#f6a77c`，搭配點點外框、貼紙標籤與實心偏移陰影。影片、合作表單、訂閱與管理功能沿用既有實作。

D 版色票與字型依據 ARS 的 [視覺規格](https://github.com/dnplus/agentic-remotion-studio/blob/7683be68b314d60695af3835407361e44667168f/docs/visual.md)（commit `7683be68`）。Nunito Sans Latin variable WOFF2 沿用同一份模板資產，授權見 `public/fonts/OFL-NunitoSans.txt`。

## 原始來源

- Sites project：`appgprj_6ac5de3556c88191bb95c89d5d6fcbfd`
- 下載來源 commit：`49480b65c5bf6c3d23bd9bb89901f7e5b140feed`
- 下載日期：2026-10-07
- 原網站：https://ginseng-try-catch.dnplus.chatgpt.site
- YouTube：https://www.youtube.com/@GinsengTryCatch
- Threads：https://www.threads.com/@ginsengtrycatch
- Instagram：https://www.instagram.com/ginsengtrycatch/
- PA Cafe：https://pacafe.dnplus.dev
- 你的 AI 夥伴風格指南：https://urai.dnplus.dev
- Genio One：https://genio.sh

原始吉祥物與人物剪影保留；影片區使用 YouTube 影片縮圖。

參考：[Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/)、[D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)、[Access JWT 驗證](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)。

### 合作表單通知

合作表單先保存至 D1，再使用 Cloudflare `CONTACT_EMAIL` binding 寄送通知至 `dnplus@mail.grokbot.com`。寄件人為已啟用 Email Sending 的 `ginseng@dnplus.dev`，Reply-To 為訪客留下的 Email；binding 限制寄件人及收件人。後台顯示 Cloudflare 已接受、失敗或尚未確認，接受寄送不代表已送達收件匣。通知失敗時需求仍保留，請從後台處理。

部署前套用 D1 migrations。`dnplus.dev` 寄信網域及 DNS 已於 2026-10-19 透過 API 確認 ready。部署必須使用該網域所屬 Cloudflare 帳號。未啟用 remote binding，本機開發僅模擬寄送，不會寄給 GrokBot；電子報寄送仍未串接。
