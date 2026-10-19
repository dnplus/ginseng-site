# 人蔘 Try Catch

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
2. 執行 `pnpm db:create`。將返回的 D1 UUID 填入 `wrangler.jsonc` 的 `d1_databases[0].database_id`，替換僅供本地使用的 placeholder。
3. 在 Cloudflare Zero Trust 建立 Self-hosted Access application，使用同一 application 保護實際部署主機上的 `/studio`、`/studio/*`、`/api/studio/*`，Allow policy 限制為管理者 Email。如果使用 workers.dev 和自訂網域，必須各自加入對應 hostname/path。
4. 在 `wrangler.jsonc` 設定 `SITE_URL` 為實際 HTTPS 網址、`CF_ACCESS_TEAM_DOMAIN` 為完整的 `https://<team>.cloudflareaccess.com`、`CF_ACCESS_AUD` 為該 application 的 AUD。
5. 執行 `pnpm exec wrangler secret put STUDIO_OWNER_EMAIL`，輸入允許管理後台的 Email。不可放在前端程式或提交到 Git 的檔案。
6. 執行 `pnpm db:migrate:remote` 建立遠端資料表，再執行 `pnpm deploy`。部署指令會重新 build，確保最新 D1 與環境設定寫入建置。

替換 D1 UUID 也會改變本地資料庫識別；之後繼續本地開發前請再執行 `pnpm db:migrate`，舊的本地測試資料不會自動移入新識別的資料庫。

`pnpm deploy:dry-run` 只產生部署檢核產物。`preview_urls` 已關閉，避免額外的預覽網址增加 Access 配置負擔。

JWT 驗證會檢查 Cloudflare 公開金鑰簽章、issuer、AUD、有效期限及管理者 Email；不接受 caller 提供的 Email 或 Sites 登入標頭。設定缺漏或驗證失敗時後台一律拒絕，管理頁及匯出回應不會被快取。

## 資料與功能

- `/`：個人介紹、YouTube、Genio One、合作聯繫及電子報。影片區由 Worker 讀取頻道 RSS（`lib/youtube.ts`），每個 isolate 快取 15 分鐘；RSS 無法取得時改用內建清單。Nunito Sans 由本站提供，Noto Sans TC 來自 Google Fonts，影片縮圖來自 i.ytimg.com。
- `/studio`：管理工作站，顯示最近資料並可匯出 CSV。
- `/unsubscribe?token=...`：確認退訂；每位訂閱者的網址包含於 CSV。
- `/privacy`：資料使用說明。
- `migrations/0001_initial.sql`：D1 初始 schema。

這次下載取得原始碼與靜態資產，**不包含 Sites 正式 D1 的訂閱者或合作紀錄**。新的 D1 從空資料表開始。原 Sites 的發布與存取設定沒有更動。

電子報維持明確同意的 single opt-in。電子報寄送服務尚未串接；匯出後寄送電子報時需保留每位訂閱者的退訂入口。

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
- Genio One：https://genio.sh

原始吉祥物與人物剪影保留；影片區使用 YouTube 影片縮圖。

參考：[Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/)、[D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)、[Access JWT 驗證](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)。

### 合作表單通知

合作表單先保存至 D1，再使用 Cloudflare `CONTACT_EMAIL` binding 寄送通知至 `dnplus@mail.grokbot.com`。寄件人為已啟用 Email Sending 的 `ginseng@dnplus.dev`，Reply-To 為訪客留下的 Email；binding 限制寄件人及收件人。後台顯示 Cloudflare 已接受、失敗或尚未確認，接受寄送不代表已送達收件匣。通知失敗時需求仍保留，請從後台處理。

部署前套用 D1 migrations。`dnplus.dev` 寄信網域及 DNS 已於 2026-10-19 透過 API 確認 ready。部署必須使用該網域所屬 Cloudflare 帳號。未啟用 remote binding，本機開發僅模擬寄送，不會寄給 GrokBot；電子報寄送仍未串接。
