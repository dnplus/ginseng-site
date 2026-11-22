import type { Locale } from './i18n';
import { CHANNEL_URL } from './youtube.ts';

export const BRAND = {zh: '人蔘 Try Catch', en: 'Ginseng Try Catch'} as const;
export { CHANNEL_URL };
export const PA_CAFE_URL = 'https://pacafe.dnplus.dev';
/** Set when the Discord server opens; until then /community shows "opening soon" and points to the newsletter. */
export const DISCORD_INVITE_URL: string | null = null;

export type Social = {name: string; url: string; icon: 'youtube' | 'threads' | 'instagram' | 'x' | 'facebook'};
const YOUTUBE: Social = {name: 'YouTube', url: CHANNEL_URL, icon: 'youtube'};
const THREADS: Social = {name: 'Threads', url: 'https://www.threads.com/@ginsengtrycatch', icon: 'threads'};
const INSTAGRAM: Social = {name: 'Instagram', url: 'https://www.instagram.com/ginsengtrycatch/', icon: 'instagram'};
const FACEBOOK: Social = {name: 'Facebook', url: 'https://www.facebook.com/ginsengtrycatch', icon: 'facebook'};
/** X is the English channel, so English pages list it first. */
export const X_ACCOUNT: Social = {name: 'X', url: 'https://x.com/ginsengtrycatch', icon: 'x'};
export function socials(locale: Locale): Social[] {
  return locale === 'en' ? [X_ACCOUNT, YOUTUBE, THREADS, INSTAGRAM, FACEBOOK] : [YOUTUBE, THREADS, INSTAGRAM, FACEBOOK, X_ACCOUNT];
}

type Text = Record<Locale, string>;
export type LabItem = {
  id: string; url: string; icon: 'coffee' | 'sparkles' | 'terminal' | 'gamepad'; status: 'live' | 'beta' | 'idea';
  kicker: Text; title: Text; body: Text; cta: Text; video?: string; featured?: boolean;
  /** Preview picture under public/, 1200:630 (stored at 800x420). Keep a copy in this repo; never link to another site's image. */
  image?: string;
};
/** Products and experiments shown on the home page and /lab. New small tools go here. */
export const LAB: LabItem[] = [
  {
    id: 'pa-cafe', url: PA_CAFE_URL, icon: 'coffee', status: 'live', video: 'tbj0Azzlguw', featured: true,
    kicker: {'zh-TW': '產品 · Personal Agent 工作空間', en: 'Product · Personal agent workspace'},
    title: {'zh-TW': 'PA Cafe', en: 'PA Cafe'},
    body: {'zh-TW': '替 AI Agent 開一間咖啡廳。把任務、協作與工作狀態，放進有角色、有生活感的小屋裡，探索和 Agent 一起工作的方式。', en: 'A cafe for your AI agents. Tasks, collaboration and status live in a cozy house with residents, so working with agents feels like having a team.'},
    cta: {'zh-TW': '逛逛 PA Cafe', en: 'Visit PA Cafe'},
    image: '/lab/pa-cafe.webp',
  },
  {
    id: 'barista-blast', url: `${PA_CAFE_URL}/@dnplus?game=barista-blast`, icon: 'gamepad', status: 'live',
    kicker: {'zh-TW': '小遊戲 · PA Cafe 門口的街上', en: 'Mini-game · On the street outside PA Cafe'},
    title: {'zh-TW': 'BARISTA BLAST!!', en: 'BARISTA BLAST!!'},
    body: {'zh-TW': '把咖啡師發射出去，一路撞住民借力，看能飛多遠。不用登入，打開就能玩，飛完還能把這一局的帳單傳給朋友比一比。', en: 'Launch your barista down the street, bounce off the residents for a boost and see how far you fly. No sign-up, just play, then send your receipt to a friend.'},
    cta: {'zh-TW': '發射咖啡師', en: 'Launch a barista'},
    image: '/lab/barista-blast.webp',
  },
  {
    id: 'urai', url: 'https://urai.dnplus.dev', icon: 'sparkles', status: 'live',
    kicker: {'zh-TW': '小工具 · AI 搭檔角色卡', en: 'Tool · AI partner card'},
    title: {'zh-TW': '你的 AI 夥伴風格指南', en: 'Your AI Partner Style Guide'},
    body: {'zh-TW': '讓你的 Agent 讀完你們的對話，說說你是哪種搭檔：16 型、卡片稀有度，再抽一張能和朋友比一比的角色卡。', en: 'Let your agent read your conversations and tell you what kind of partner you are: 16 types, card rarity, and a character card to compare with friends.'},
    cta: {'zh-TW': '測測你的搭檔風格', en: 'Find your style'},
    image: '/lab/urai.webp',
  },
  {
    id: 'genio', url: 'https://genio.sh', icon: 'terminal', status: 'beta', video: 'bvRPXARAK0A',
    kicker: {'zh-TW': '實驗 · 企業 AI 實作', en: 'Experiment · Enterprise AI'},
    title: {'zh-TW': 'Genio One', en: 'Genio One'},
    body: {'zh-TW': '從 AI 代理到企業存取治理，把實驗往真實工作再推進一步。', en: 'From AI agents to enterprise access governance: pushing the experiment one step closer to real work.'},
    cta: {'zh-TW': '看看專案', en: 'See the project'},
    image: '/lab/genio.webp',
  },
];
