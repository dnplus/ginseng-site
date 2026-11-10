// Site languages. Traditional Chinese is the default and lives at the root so existing URLs (and QR codes printed in
// videos) never move; every other language gets a path prefix. pa-cafe ships en, zh-TW, zh-CN, ja and ko; this site
// starts with the two languages it has content for. Add a locale here, then add its dictionary entry below.
export const LOCALES = ['zh-TW', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'zh-TW';

const PREFIX: Record<Locale, string> = {'zh-TW': '', en: '/en'};
/** BCP 47 tag for `<html lang>` and `hreflang`. */
export const HTML_LANG: Record<Locale, string> = {'zh-TW': 'zh-Hant-TW', en: 'en'};
export const OG_LOCALE: Record<Locale, string> = {'zh-TW': 'zh_TW', en: 'en_US'};
export const LANGUAGE_NAME: Record<Locale, string> = {'zh-TW': '中文', en: 'English'};

export const isLocale = (value: unknown): value is Locale => typeof value === 'string' && (LOCALES as readonly string[]).includes(value);

/** The locale a pathname belongs to: `/en` and `/en/...` are English, everything else is the default. */
export function localeOf(pathname: string): Locale {
  for (const locale of LOCALES) {
    const prefix = PREFIX[locale];
    if (prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))) return locale;
  }
  return DEFAULT_LOCALE;
}

/** A site path in the given locale. `path` is the locale-neutral path, e.g. `/blog` or `/`. */
export function localePath(locale: Locale, path = '/') {
  const clean = path.startsWith('/') ? path : `/${path}`;
  const prefix = PREFIX[locale];
  if (!prefix) return clean;
  return clean === '/' ? prefix : `${prefix}${clean}`;
}

/**
 * Next metadata `alternates` for a page that exists in `available` locales (all by default). Pages whose content is
 * missing in a language must not advertise that language, or search engines index an empty or mismatched page.
 */
export function alternates(locale: Locale, path: string, available: readonly Locale[] = LOCALES) {
  const languages: Record<string, string> = {};
  for (const each of available) languages[HTML_LANG[each]] = localePath(each, path);
  if (available.includes(DEFAULT_LOCALE)) languages['x-default'] = localePath(DEFAULT_LOCALE, path);
  return {canonical: localePath(locale, path), languages};
}

const zh = {
  skip: '跳到主要內容',
  homeLabel: '人蔘 Try Catch 首頁',
  nav: {projects: '專案', lab: '實驗室', videos: '影片', blog: '文章', community: '社群', contact: '合作', subscribe: '訂閱電子報', youtube: '訂閱 YouTube', menu: '開啟導覽', main: '主要導覽', mobile: '手機導覽'},
  language: {label: '切換語言', suggest: '這頁也有中文版'},
  footer: {tagline: '少一點內捲，多一點外掛。', privacy: '隱私說明', nav: '社群與網站資訊'},
  meta: {
    title: '人蔘 Try Catch｜少一點內捲，多一點外掛',
    description: '我是人蔘，技術主管與 AI 實驗者。分享 AI Agent 實測、工程實戰與職場觀察。探索創作、聊聊商業合作，訂閱人蔘電子報。',
    ogTitle: '人蔘 Try Catch｜把好奇心，做成有用的東西',
    ogDescription: 'AI 工具、系統實作，還有一些讓工作變輕鬆的外掛。',
  },
  home: {
    hello: '嗨，我是人蔘。',
    title: ['把好奇心，', '做成有用的東西。'],
    lead: '技術主管，也是每天在 Try…Catch 裡打滾的創作者。研究 AI，把它放進真實工作，再把踩過的坑整理給你。',
    primary: '訂閱 YouTube', secondary: '聊聊合作',
    socials: '追蹤人蔘的社群帳號',
    latest: '最新影片',
    mascotNote: '本人，大概長這樣',
    hubSticker: '從這裡開始',
    hubTitle: '人蔘 Try Catch 的四個角落',
    hubIntro: '一個品牌，四種認識我的方式。挑你有興趣的開始。',
    projectsSticker: '親手做的東西',
    projectsTitle: '最近在做的事',
    projectsIntro: '把 AI 放進產品與工作裡，一邊做，一邊分享實作過程。',
    videosSticker: '創作與實驗',
    videosTitle: '最近的影片',
    videosIntro: 'AI 工具實測、Agent 工作流，還有產業的一些觀察。',
    videosFallback: 'YouTube 暫時無法更新，目前顯示備用清單；最新內容請看頻道。',
    videosLive: '每 15 分鐘更新一次頻道影片。',
    channel: 'YouTube 頻道',
    popular: '這支最多人看',
    views: (count: string) => `${count} 次觀看`,
    aboutSticker: '關於人蔘',
    aboutTitle: ['一半技術人，', '一半好奇鬼。'],
    aboutLead: '喜歡把複雜的事情拆開，再重新組成好用的東西。',
    aboutBody: ['我的工作哲學是「精準省力」：先問對問題，再挑工具。不為了技術而技術，也不把忙碌當成成就。', '在頻道裡，我分享 AI Agent 實測、工程實戰與職場觀察。把技術玩明白，把時間省下來，留給真正有意思的事。'],
    codeComment: '// 下一秒會拋出什麼，沒人知道',
    codeLife: '過日子', codeCatch: '接住',
    codeCaption: '人生就像 Try…Catch，你永遠不知道下一秒會拋出什麼 Exception，反正 Catch 住就對了。',
    contactSticker: '合作聊聊',
    contactTitle: ['有個點子？', '一起試試。'],
    contactLead: '品牌合作、企業分享、AI 工具實作。如果你也喜歡把事情做得更聰明，歡迎聊聊。',
    services: [
      ['內容與品牌合作', '產品實測、內容企劃、技術觀點分享。一起找出對觀眾有用的切入點。'],
      ['企業分享與工作坊', '從 AI 工具、Agent 工作流到工程實務，把抽象概念變成可以動手的內容。'],
      ['產品交流與實作', '有技術卡點或新產品構想？聊聊現況、目標，以及值得先做的小實驗。'],
    ],
    newsletterTitle: '好用的，留給你。',
    newsletterLead: '訂閱人蔘電子報，收到值得試的 AI 工具與工作靈感。不定期寄送，隨時都能退訂。',
  },
  hub: {
    youtube: {kicker: '持續輸出', title: 'YouTube 頻道', body: '中文的 AI 工具實測、Agent 工作流與工程實戰，每集都有對應的文章。', cta: '看影片'},
    pacafe: {kicker: '產品', title: 'PA Cafe', body: '替你的 AI Agent 開一間咖啡廳。有角色、有生活感的 Personal Agent 工作空間。', cta: '逛逛 PA Cafe'},
    lab: {kicker: '小工具與新點子', title: '實驗室', body: '做完就放上來的小工具和實驗，好玩、能用，也可能隨時長大。', cta: '進實驗室'},
    community: {kicker: '自己人', title: 'Discord 社群', body: '跟人蔘和其他一起實驗的人聊工具、分享成果、搶先試新東西。', cta: '認識社群'},
  },
  blog: {
    title: '文章｜人蔘 Try Catch',
    description: '人蔘的文章：每集影片的文字版、AI 工具實測與 Agent 工作流筆記。',
    sticker: '文章',
    heading: '影片之外，寫下來的部分。',
    lead: '每集影片都有一篇對應的文章：重點、來源連結和影片裡沒時間講的細節。',
    empty: '文章正在從 Notion 搬過來，很快就會出現在這裡。',
    otherLanguage: 'English articles',
    watch: '看這集影片',
    episode: (number: number) => `EP${String(number).padStart(3, '0')}`,
    translated: '本文由英文版翻譯。',
    back: '所有文章',
    feed: 'RSS 訂閱',
    readMore: '閱讀全文',
  },
  newsletter: {
    title: '電子報｜人蔘 Try Catch',
    description: '人蔘電子報：值得試的 AI 工具、Agent 工作流，以及新影片和實驗室的消息。附歷期存檔。',
    sticker: '人蔘電子報',
    heading: '好用的，留給你。',
    lead: '雙週一封：新影片與文章、值得試的工具、實驗室的新東西。不灌水，隨時都能退訂。',
    archive: '歷期電子報',
    archiveEmpty: '第一期正在準備中。現在訂閱，就會收到第一封。',
    issue: '期',
    back: '所有電子報',
    pendingTitle: '快好了，去信箱確認一下。',
    pendingBody: '確認信已寄到你的信箱，點信裡的按鈕就完成訂閱。沒看到的話，找找垃圾信或促銷分類。',
    confirmTitle: '確認訂閱人蔘電子報',
    confirmBody: '按下按鈕，就會開始收到人蔘電子報。',
    confirmButton: '確認訂閱',
    confirmWorking: '確認中…',
    confirmDone: '訂閱完成！下一封信見。',
    confirmMissing: '請使用確認信中的完整連結。',
    email: {
      subject: '請確認訂閱人蔘電子報',
      greeting: '嗨，我是人蔘。',
      body: '有人（希望是你）用這個信箱訂閱了人蔘電子報。點下面的按鈕確認，之後就會收到值得試的 AI 工具與工作靈感。',
      button: '確認訂閱',
      ignore: '如果不是你訂閱的，忽略這封信就好，不會再收到任何信。連結 7 天內有效。',
    },
  },
  lab: {
    title: '實驗室｜人蔘 Try Catch',
    description: '人蔘做的小工具與實驗：PA Cafe、你的 AI 夥伴風格指南、Genio One，還有更多新點子。',
    sticker: '實驗室',
    heading: '做出來，先放這裡。',
    lead: '小工具、產品與各種實驗。有些會長成正式產品，有些就是好玩。新東西上線時，電子報會第一個通知你。',
    status: {live: '上線中', beta: '測試中', idea: '構想中'},
    watch: '看開發影片',
    back: '回到首頁',
  },
  community: {
    title: '社群｜人蔘 Try Catch',
    description: '人蔘的 Discord 社群：一起實驗 AI 工具與 Agent 工作流。',
    sticker: 'Discord 社群',
    heading: '一起實驗的人，聚在這裡。',
    lead: '人蔘 Try Catch 的 Discord 是給喜歡動手試的人：分享工具與工作流、問卡關的問題、搶先試 PA Cafe 和實驗室的新東西。',
    perks: [
      ['聊工具與工作流', 'AI Agent、自動化、開發工具，實際用起來怎麼樣，大家直接交流。'],
      ['搶先試新東西', 'PA Cafe 新功能、實驗室的新工具，社群成員最先拿到。'],
      ['中文與英文頻道', '中文為主，也有給國際朋友的 English 頻道。'],
    ],
    supporters: '支持者頻道',
    supportersBody: '購買人蔘 Try Catch 的任何方案（包含 PA Cafe Pro），都會自動取得 Discord 支持者身分組，打開專屬頻道。',
    soonTitle: '社群即將開放',
    soonBody: '目前還在準備中。訂閱電子報，開放時第一個收到邀請。',
    join: '加入 Discord',
    back: '回到首頁',
  },
  forms: {
    sending: '送出中', failed: '送出失敗，請稍後再試。', network: '連線失敗，請稍後重試。',
    name: '怎麼稱呼你', namePlaceholder: '你的名字', company: '公司 / 品牌（選填）', companyPlaceholder: '公司或品牌名稱',
    emailPlaceholder: 'you@company.com', topic: '想聊什麼？', topicPlaceholder: '請選擇合作類型', idea: '你的想法',
    ideaPlaceholder: '簡單說說你的需求、時間與期待。（至少 10 字）',
    contactConsent: ['同意依', '隱私說明', '使用資料，僅用於回覆這次洽談。'],
    contactSubmit: '送出合作提案', contactLabel: '商業合作表單',
    contactDoneTitle: '點子，接住了。', contactDoneBody: '合作需求已儲存。人蔘會透過你留下的 Email 聯繫你。', contactAgain: '再聊另一個點子',
    newsletterLabel: '電子報訂閱', newsletterEmail: '你的 Email', newsletterSubmit: '訂閱',
    newsletterConsent: ['我同意接收人蔘電子報，並已閱讀', '隱私說明', '。'],
    newsletterDoneTitle: '快好了，去信箱確認一下。', newsletterDoneBody: '確認信已寄出，點信裡的按鈕就完成訂閱。',
    topics: {} as Record<string, string>,
  },
};

type Dictionary = typeof zh;

const en: Dictionary = {
  skip: 'Skip to main content',
  homeLabel: 'Ginseng Try Catch home',
  nav: {projects: 'Projects', lab: 'Lab', videos: 'Videos', blog: 'Writing', community: 'Community', contact: 'Work with me', subscribe: 'Newsletter', youtube: 'Subscribe on YouTube', menu: 'Open navigation', main: 'Main navigation', mobile: 'Mobile navigation'},
  language: {label: 'Change language', suggest: 'This page is also available in English'},
  footer: {tagline: 'Less grind, more power-ups.', privacy: 'Privacy', nav: 'Social and site information'},
  meta: {
    title: 'Ginseng Try Catch | Less grind, more power-ups',
    description: 'I am Ginseng, an engineering lead and AI tinkerer from Taiwan. I build PA Cafe, a home for personal AI agents, and share agent workflows, experiments and small tools.',
    ogTitle: 'Ginseng Try Catch | Turning curiosity into useful things',
    ogDescription: 'AI agents, real-world engineering and small tools that make work lighter.',
  },
  home: {
    hello: "Hi, I'm Ginseng.",
    title: ['Turning curiosity', 'into useful things.'],
    lead: 'Engineering lead by day, maker inside an endless try…catch. I put AI into real work, build things like PA Cafe, and share what breaks along the way.',
    primary: 'Visit PA Cafe', secondary: 'Work with me',
    socials: "Follow Ginseng's social accounts",
    latest: 'Latest video (Mandarin)',
    mascotNote: 'Roughly what I look like',
    hubSticker: 'Start here',
    hubTitle: 'Four corners of Ginseng Try Catch',
    hubIntro: 'One brand, four ways in. Pick whatever looks fun.',
    projectsSticker: 'Things I build',
    projectsTitle: "What I'm working on",
    projectsIntro: 'Putting AI into products and everyday work, and sharing how it is built.',
    videosSticker: 'Videos',
    videosTitle: 'Latest videos',
    videosIntro: 'My YouTube channel is in Mandarin Chinese: AI tool reviews, agent workflows and industry notes.',
    videosFallback: 'YouTube could not be reached, so this is a saved list. See the channel for the newest videos.',
    videosLive: 'Refreshed from the channel every 15 minutes.',
    channel: 'YouTube channel',
    popular: 'Most watched',
    views: (count: string) => `${count} views`,
    aboutSticker: 'About Ginseng',
    aboutTitle: ['Half engineer,', 'half curious kid.'],
    aboutLead: 'I like taking complicated things apart and putting them back together as something useful.',
    aboutBody: ['My rule is "precise and effortless": ask the right question first, then pick the tool. No tech for its own sake, and busy is not an achievement.', 'I share AI agent experiments, hands-on engineering and notes from work, so you can save the time for what actually matters.'],
    codeComment: '// nobody knows what gets thrown next',
    codeLife: 'live', codeCatch: 'handle',
    codeCaption: "Life is a try…catch. You never know which exception comes next, so just catch it.",
    contactSticker: 'Work with me',
    contactTitle: ['Got an idea?', "Let's try it."],
    contactLead: 'Brand collaborations, talks and workshops, hands-on AI implementation. If you like doing things the smarter way, say hi.',
    services: [
      ['Content and brand collaborations', 'Product reviews, content planning and technical perspectives, aimed at what is genuinely useful for the audience.'],
      ['Talks and workshops', 'From AI tools and agent workflows to engineering practice, turned into something people can do with their hands.'],
      ['Product and implementation chats', 'Stuck on something technical, or sketching a new product? Bring the context and goals and we find the right small experiment.'],
    ],
    newsletterTitle: 'The useful bits, for you.',
    newsletterLead: 'Get AI tools worth trying, agent workflows and new experiments from the lab. Occasional, and you can unsubscribe any time.',
  },
  hub: {
    youtube: {kicker: 'Ongoing', title: 'YouTube (Mandarin)', body: 'Hands-on AI tool reviews, agent workflows and engineering. Every episode comes with a written article.', cta: 'Watch'},
    pacafe: {kicker: 'Product', title: 'PA Cafe', body: 'A cozy cafe for your personal AI agents: residents, rooms and real work, in five languages.', cta: 'Visit PA Cafe'},
    lab: {kicker: 'Small tools and ideas', title: 'The Lab', body: 'Small tools and experiments, shipped as soon as they work. Some of them grow up.', cta: 'Open the Lab'},
    community: {kicker: 'Hang out', title: 'Discord community', body: 'Talk tools and workflows with Ginseng and other tinkerers, share what you built, try new things first.', cta: 'Meet the community'},
  },
  blog: {
    title: 'Writing | Ginseng Try Catch',
    description: 'Articles by Ginseng on AI agents, tools and building PA Cafe.',
    sticker: 'Writing',
    heading: 'The written-down part.',
    lead: 'Notes on AI agents, tools and building PA Cafe. My videos are in Mandarin; the best of them are translated here.',
    empty: 'The first English articles are on their way. Meanwhile, the Mandarin articles are linked below.',
    otherLanguage: '中文文章',
    watch: 'Watch the episode (Mandarin)',
    episode: (number: number) => `EP${String(number).padStart(3, '0')}`,
    translated: 'Translated from the Mandarin original.',
    back: 'All articles',
    feed: 'RSS feed',
    readMore: 'Read',
  },
  newsletter: {
    title: 'Newsletter | Ginseng Try Catch',
    description: 'The Ginseng Try Catch newsletter: AI tools worth trying, agent workflows, and news from the Lab. With the full archive.',
    sticker: 'Newsletter',
    heading: 'The useful bits, for you.',
    lead: 'A monthly letter: English articles, PA Cafe updates and new tools from the Lab. No filler, unsubscribe any time.',
    archive: 'Past issues',
    archiveEmpty: 'The first English issue is being written. Subscribe now and it will be in your inbox.',
    issue: 'Issue',
    back: 'All issues',
    pendingTitle: 'Almost there. Check your inbox.',
    pendingBody: 'We sent you a confirmation email. Click the button in it to finish subscribing. If it is not there, check spam or promotions.',
    confirmTitle: 'Confirm your subscription',
    confirmBody: 'Press the button to start receiving the Ginseng Try Catch newsletter.',
    confirmButton: 'Confirm subscription',
    confirmWorking: 'Confirming…',
    confirmDone: "You're subscribed. See you in the next issue!",
    confirmMissing: 'Please use the full link from the confirmation email.',
    email: {
      subject: 'Confirm your Ginseng Try Catch subscription',
      greeting: "Hi, I'm Ginseng.",
      body: 'Someone (hopefully you) subscribed this address to the Ginseng Try Catch newsletter. Click the button to confirm, and you will get AI tools worth trying and new experiments from the Lab.',
      button: 'Confirm subscription',
      ignore: 'If this was not you, just ignore this email and nothing more will be sent. The link is valid for 7 days.',
    },
  },
  lab: {
    title: 'The Lab | Ginseng Try Catch',
    description: 'Small tools and experiments by Ginseng: PA Cafe, the AI partner style guide, Genio One and more.',
    sticker: 'The Lab',
    heading: 'Built it? It goes here first.',
    lead: 'Small tools, products and experiments. Some become real products, some are just for fun. The newsletter hears about new ones first.',
    status: {live: 'Live', beta: 'Beta', idea: 'Idea'},
    watch: 'Watch the dev video (Mandarin)',
    back: 'Back to home',
  },
  community: {
    title: 'Community | Ginseng Try Catch',
    description: "Ginseng's Discord community for people experimenting with AI tools and agent workflows.",
    sticker: 'Discord community',
    heading: 'Where the tinkerers hang out.',
    lead: 'The Ginseng Try Catch Discord is for people who like to try things: share tools and workflows, ask about what is stuck, and get early access to PA Cafe and Lab experiments.',
    perks: [
      ['Tools and workflows', 'AI agents, automation and developer tools, and how they actually hold up in daily use.'],
      ['Try things first', 'New PA Cafe features and Lab tools reach community members first.'],
      ['English and Mandarin', 'Mostly Mandarin, with an English channel for friends from everywhere.'],
    ],
    supporters: 'Supporter channels',
    supportersBody: 'Any Ginseng Try Catch purchase, including PA Cafe Pro, automatically gives you the Discord supporter role and its channels.',
    soonTitle: 'Opening soon',
    soonBody: 'The server is still being set up. Join the newsletter to get the invite when it opens.',
    join: 'Join the Discord',
    back: 'Back to home',
  },
  forms: {
    sending: 'Sending', failed: 'Could not send. Please try again later.', network: 'Connection failed. Please try again.',
    name: 'Your name', namePlaceholder: 'Your name', company: 'Company / brand (optional)', companyPlaceholder: 'Company or brand',
    emailPlaceholder: 'you@company.com', topic: 'What is it about?', topicPlaceholder: 'Choose a topic', idea: 'Your idea',
    ideaPlaceholder: 'Tell me what you need, your timeline and expectations. (At least 10 characters)',
    contactConsent: ['I agree my data is used under the ', 'privacy notice', ', only to reply to this inquiry.'],
    contactSubmit: 'Send', contactLabel: 'Collaboration form',
    contactDoneTitle: 'Idea caught.', contactDoneBody: 'Your message is saved. Ginseng will reply to the email you left.', contactAgain: 'Send another idea',
    newsletterLabel: 'Newsletter signup', newsletterEmail: 'Your email', newsletterSubmit: 'Subscribe',
    newsletterConsent: ['I agree to receive the Ginseng Try Catch newsletter and have read the ', 'privacy notice', '.'],
    newsletterDoneTitle: 'Almost there. Check your inbox.', newsletterDoneBody: 'Click the button in the confirmation email to finish subscribing.',
    // Stored values stay the Chinese topic names (lib/validation.ts TOPICS); only the label is translated.
    topics: {'AI 導入 / 技術顧問': 'AI adoption / technical advice', '企業內訓 / 分享邀約': 'Workshops / talks', '品牌合作 / 內容企劃': 'Brand / content collaboration', '其他有趣的可能': 'Something else interesting'},
  },
};

const DICTIONARIES: Record<Locale, Dictionary> = {'zh-TW': zh, en};
export const dictionary = (locale: Locale): Dictionary => DICTIONARIES[locale];
export type {Dictionary};
