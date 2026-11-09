---
title: "Notion AI 會議助手實戰：從開會一路接到派工"
date: 2026-08-20
summary: "AI 會議助手百百種；我最後選擇 Notion AI 會議助手，因為從會前、會中到會後派工都能留在同一個工作空間。"
tags: [Notion, AI Agent, 教學入門]
cover: /blog/notion-ai-meeting-assistant/cover.webp
---

> 🎙️ AI 會議助手百百種；我最後選擇 **Notion AI 會議助手**，因為從會前、會中到會後派工都能留在同一個工作空間。影片尾卡的 QR Code 指向本頁。


## 一句話結論

AI 會議助手真正省時間的地方，不只是把聲音變成文字，而是讓 **Calendar → Meeting Notes → 逐字稿 → 摘要 → 會中查詢 → Custom Agent 派工** 沿用同一份脈絡。

## 工作流總覽

| 階段 | Notion 裡發生的事 | 省下的交接 |
| --- | --- | --- |
| 會前 | Calendar 事件準備 Meeting Notes | 不用臨時另開錄音與筆記工具 |
| 會中 | 逐字稿、引用與 Notion AI 留在同頁 | 漏聽或遇到術語時不用跳出會議脈絡 |
| 會後 | 摘要完成後觸發 Custom Agent 建立候選任務 | 不用把摘要重新抄成待辦 |

## 1. Calendar 先接住會議

Notion Calendar 可連接 Google Calendar、Apple iCloud 與 Microsoft Outlook。

- 把 AI Meeting Notes 設成自動加入新事件，會議開始前就能先準備好筆記入口。
- 也可以從 Calendar 直接使用 **Join and transcribe**。
- 在桌面版按下 **Start transcribing** 後，可同時收麥克風與系統聲音。
- 停止後會生成摘要；摘要中的引用可跳回逐字稿原句。
- 分享方式依工作區與 AI Meeting Notes 設定決定。

## 2. 公司 CalDAV 的橋接方式

我公司的行事曆不是 Notion Calendar 原生支援來源，所以實際使用的接法是：

> **公司 CalDAV → vdirsyncer → 私人 Google Calendar → Notion Calendar**

**vdirsyncer** 是開源的命令列同步工具。設定兩端帳號與同步規則，再用排程定期執行，公司會議便能透過 Google Calendar 進入後續 Meeting Notes 流程。

這是我的個人橋接方式，不是 Notion 的內建設定。採用前要先確認公司的行事曆與資料政策。

## 3. 讓摘要直接符合工作格式

摘要不必永遠長一樣，可以依會議類型改用不同指示：

- **客戶介紹／Sales Call：**客戶需求、疑問、異議、下一步。
- **內部會議／Team Meeting：**決策、討論重點、行動項目。
- **Standup：**每人進度、目前阻礙、今天要做什麼。
- **Custom：**依團隊自己的 SOP 固定輸出格式。

指示可以自己改，也可以直接請 Notion AI 先幫你寫，再調整成團隊要的格式。設定一次，之後同類會議就能沿用。

## 4. 會議進行中直接問 Notion AI

逐字稿與工作區知識放在同一個地方後，我會在會中直接處理三種問題：

1. **術語沒聽過：**請 Notion AI 當場解釋。
2. **剛剛有一段沒聽清楚：**從目前的會議內容找回對應段落。
3. **對方提到某個產品：**連同工作區既有資料一起查。

查詢結果仍留在同一頁，不必會後再把答案搬回會議紀錄。

## 5. 摘要完成後交給 Custom Agent

Notion 的 Custom Agent 可使用 **Meeting note summarized** 作為 trigger。我的會議代辦 Agent 會在摘要完成後接手：

1. 只辨識明確指派給我方的 action items。
2. 負責人或期限不清楚時保留待確認，不自行猜測。
3. 讀取會議來源，寫入指定的 Tasks database。
4. 在任務中保留原會議連結，方便回查決策脈絡。
5. 最後由人審核任務、負責人與期限。

Agent 負責把內容整理成候選任務；最後判斷仍由人完成。

## 什麼情況最值得用？

- 工作本來就在 Notion。
- 每週有固定數量的內部或客戶會議。
- 會後常需要整理摘要、建立任務與追蹤負責人。
- 團隊願意先定義摘要格式、Agent instructions 與可寫入範圍。

如果只需要單純轉錄，選擇很多；如果最痛的是工具之間反覆複製、貼上與重整格式，這條流程才會真正省時間。

## 實作檢查清單

- [ ] Calendar 帳號已連接並看到正確事件
- [ ] AI Meeting Notes 的新增與分享設定已確認
- [ ] 摘要格式符合會議類型
- [ ] Custom Agent trigger 已指向 Meeting note summarized
- [ ] Agent 只取得必要的讀取與寫入範圍
- [ ] 測試任務保留原會議連結
- [ ] 前幾次執行都有人工審核

## 素材與延伸閱讀

- [Notion Help — AI Meeting Notes](https://www.notion.com/help/ai-meeting-notes)
- [Notion Help — Create a Notion Calendar account](https://www.notion.com/help/create-a-notion-calendar-account)
- [Notion Release — AI Meeting Notes can trigger Custom Agents](https://www.notion.com/releases/2026-07-31)
- [vdirsyncer — GitHub](https://github.com/pimutils/vdirsyncer)

---

最後更新：2026-08-22
