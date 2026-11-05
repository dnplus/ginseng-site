---
title: "AI 訂閱不是固定商品：20 美金、Reset 與算力圈地戰"
date: 2026-09-10
summary: "同樣每個月付 20 美金，為什麼 AI 有時可以一路用，有時卻很快撞到限制？"
youtube: ECqfhUoR-B4
tags: [產業分析, 商業策略]
---

同樣每個月付 20 美金，為什麼 AI 有時可以一路用，有時卻很快撞到限制？

答案可能不是「方案縮水」這麼簡單。AI 訂閱比較像買到一個等級的**算力使用權**：方案決定優先權、可以用哪些模型，以及資源緊繃時能分到多少算力。真正可用的額度，還會跟供需一起變動。

## 使用限制只是表象

一般軟體的每一次操作，成本差異通常有限；AI 完全不是這樣。簡單問答、深度研究、讓程式代理工作半小時，背後消耗的算力可以差非常多。

新模型一推出，需求可能在幾小時內翻倍。GPU、資料中心和電力卻不可能同步翻倍。模型公司只能排隊、限速、降低某些方案額度、把工作導向其他模型，或請使用者晚一點再來。

我們看到的是使用額度；平台真正處理的是**算力分配**：有限的算力，現在應該分給誰？

## Reset 比較像算力選擇權

Codex／Astra 推出期間出現的 banked reset，表面上是多送一次 Reset。換個市場角度看，它讓使用者在未來某個時間點，重新取得一段算力的權利。

所以它不像固定交割的期貨，反而比較接近一張**算力選擇權**。

Reset 還有另一個效果：搬移需求。如果所有人晚上八點同時撞限制，八點整一起 Reset，八點零一分大家又全部回來。尖峰根本沒有消失。讓每個人自己選兌換時間，需求就能分散到今晚、明天或週末。這同時也在調節需求。

## AI 公司同時打兩場戰爭

上游搶的是算力供給：GPU、資料中心、電力、HBM、網路設備與雲端算力。

下游搶的是算力需求：使用者每天願意把多少工作交給哪一家模型。

模型位在兩個市場中間，把算力轉換成可以賣給使用者的 AI 能力。這也解釋了為什麼使用額度會跟著供給變動。Anthropic 曾把新的算力合作與更高的 Claude 使用額度直接連在一起。[\[1\]](https://www.anthropic.com/news/higher-limits-spacex)

## OpenAI：從算力買方走向架構設計者

Stargate 解決的是未來有沒有足夠算力可以賣。OpenAI 也透過 Cerebras 建立更有韌性的算力組合，把不同工作負載送往適合的硬體。[\[2\]](https://openai.com/index/five-new-stargate-sites) [\[3\]](https://openai.com/index/cerebras-partnership/)

更往下，OpenAI 與 Broadcom 推進自研推論晶片 Jalapeño。關鍵在於直接介入每一單位 AI 能力的成本。成本若從 100 降到 70，省下的空間可以拿來降 API 價格、放寬額度、發 Reset，或補貼 Codex。[\[4\]](https://openai.com/index/jalapeno-first-results)

## SpaceXAI：把建設速度變成產品能力

SpaceX 與 xAI 合流後，模型、資料中心、電力與大型工程被放進同一個體系。Colossus 最值得注意的不只規模，還有建設速度。[\[5\]](https://x.ai/colossus)

當 SpaceXAI 的算力可以供應 Anthropic，它的角色也從算力買方往算力供應商移動。模型公司與算力供應商之間的界線開始消失。[\[6\]](https://x.ai/news/anthropic-compute-partnership)

Terafab 則把野心繼續往晶片製造延伸。但這目前應該視為計畫，不是成熟量產能力。晶圓廠的良率、製程與供應鏈難度，跟蓋資料中心完全不是同一個等級。

## Google：最完整的全端玩家

如果只盯著 Gemini 的回答，很容易低估 Google。

Google 同時握有電力與資料中心、TPU、Google Cloud、Gemini／Veo／Imagen、XLA／JAX，還有 Search、Workspace、Android、YouTube 等大量產品入口。放進算力市場的比喻裡，它很像同時擁有礦場、煉油廠、交易平台與零售通路。

第八代 TPU 進一步拆成偏模型訓練的 8t，以及偏推論與低延遲代理工作負載的 8i。不同算力需求，用不同晶片處理。[\[7\]](https://cloud.google.com/blog/products/compute/tpu-8t-and-tpu-8i-technical-deep-dive)

TPU 也不只服務 Google 自己的模型。Gemini、Veo、Imagen 與 Claude 等工作都可能使用 Google 的基礎設施。Google 既是使用者、買方，也是供應商。[\[8\]](https://cloud.google.com/blog/products/compute/ironwood-tpus-and-new-axion-based-vms-for-your-ai-workloads)

供應鏈甚至一路下探到電力。Google 在芬蘭的 AI 基礎設施投資與長期能源安排，顯示巨頭搶的已經不是單一 GPU，而是從電力、資料中心、網路、晶片、模型一路到產品的完整 AI 算力供應鏈。[\[9\]](https://blog.google/innovation-and-ai/infrastructure-and-cloud/global-network/google-ai-commitment-to-finland/)

## 下一個競爭維度：算力分配

AI 第一階段比能力，接著比價格。第三個維度會越來越重要：**算力分配**。

誰能更早取得未來算力？誰能更便宜地生產 AI 能力？誰能預測需求？誰能把不同模型、硬體、時間與優先權的需求，最有效率地塞進算力池？誰又能在算力有餘裕時，把多出的部分拿去拉新使用者、搶市場占有率？

股票市場早就有智慧訂單路由。AI 最後可能也會出現類似角色：代理送出任務，路由器同時查看算力、壅塞、成本、延遲、SLA、任務強度、期限與硬體，決定這張算力訂單現在該去哪裡成交。

今天我們叫它模型路由器；未來它可能更像 AI 世界的**智慧訂單路由**。

---

使用限制只是表象。下一場 AI 戰爭，除了模型夠不夠聰明，還要看誰能掌握更多算力，並把每一單位算力放到最有價值的地方。
