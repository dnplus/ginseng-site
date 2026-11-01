import type { Locale } from './i18n';
import { CHANNEL_URL } from './youtube';

export const BRAND = {zh: '人蔘 Try Catch', en: 'Ginseng Try Catch'} as const;
export { CHANNEL_URL };
export const PA_CAFE_URL = 'https://pacafe.dnplus.dev';
/** Set when the Discord server opens; until then /community shows "opening soon" and points to the newsletter. */
export const DISCORD_INVITE_URL: string | null = null;

export type Social = {name: string; handle: string; url: string; icon: 'youtube' | 'threads' | 'instagram' | 'x'};
const SOCIALS: Social[] = [
  {name: 'YouTube', handle: '@GinsengTryCatch', url: CHANNEL_URL, icon: 'youtube'},
  {name: 'Threads', handle: '@ginsengtrycatch', url: 'https://www.threads.com/@ginsengtrycatch', icon: 'threads'},
  {name: 'Instagram', handle: '@ginsengtrycatch', url: 'https://www.instagram.com/ginsengtrycatch/', icon: 'instagram'},
];
/** X is the English channel; add it here once the handle is live and it shows up first on English pages. */
const X_ACCOUNT: Social | null = null;
export function socials(locale: Locale): Social[] {
  if (!X_ACCOUNT) return SOCIALS;
  return locale === 'en' ? [X_ACCOUNT, ...SOCIALS] : [...SOCIALS, X_ACCOUNT];
}

type Text = Record<Locale, string>;
export type LabItem = {
  id: string; url: string; icon: 'coffee' | 'sparkles' | 'terminal'; status: 'live' | 'beta' | 'idea';
  kicker: Text; title: Text; body: Text; cta: Text; video?: string; featured?: boolean;
};
/** Products and experiments shown on the home page and /lab. New small tools go here. */
export const LAB: LabItem[] = [
  {
    id: 'pa-cafe', url: PA_CAFE_URL, icon: 'coffee', status: 'live', video: 'tbj0Azzlguw', featured: true,
    kicker: {'zh-TW': '產品 · Personal Agent 工作空間', en: 'Product · Personal agent workspace'},
    title: {'zh-TW': 'PA Cafe', en: 'PA Cafe'},
    body: {'zh-TW': '替 AI Agent 開一間咖啡廳。把任務、協作與工作狀態，放進有角色、有生活感的小屋裡，探索和 Agent 一起工作的方式。', en: 'A cafe for your AI agents. Tasks, collaboration and status live in a cozy house with residents, so working with agents feels like having a team.'},
    cta: {'zh-TW': '逛逛 PA Cafe', en: 'Visit PA Cafe'},
  },
  {
    id: 'urai', url: 'https://urai.dnplus.dev', icon: 'sparkles', status: 'live',
    kicker: {'zh-TW': '小工具 · AI 搭檔角色卡', en: 'Tool · AI partner card'},
    title: {'zh-TW': '你的 AI 夥伴風格指南', en: 'Your AI Partner Style Guide'},
    body: {'zh-TW': '讓你的 Agent 讀完你們的對話，說說你是哪種搭檔：16 型、卡片稀有度，再抽一張能和朋友比一比的角色卡。', en: 'Let your agent read your conversations and tell you what kind of partner you are: 16 types, card rarity, and a character card to compare with friends.'},
    cta: {'zh-TW': '測測你的搭檔風格', en: 'Find your style'},
  },
  {
    id: 'genio', url: 'https://genio.sh', icon: 'terminal', status: 'beta', video: 'bvRPXARAK0A',
    kicker: {'zh-TW': '實驗 · 企業 AI 實作', en: 'Experiment · Enterprise AI'},
    title: {'zh-TW': 'Genio One', en: 'Genio One'},
    body: {'zh-TW': '從 AI 代理到企業存取治理，把實驗往真實工作再推進一步。', en: 'From AI agents to enterprise access governance: pushing the experiment one step closer to real work.'},
    cta: {'zh-TW': '看看專案', en: 'See the project'},
  },
];
