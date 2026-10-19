import type { Metadata } from 'next';
import { env } from 'cloudflare:workers';
import './globals.css';
export const metadata: Metadata = {
  ...(env.SITE_URL ? {metadataBase: new URL(env.SITE_URL)} : {}),
  title: '人蔘 Try Catch｜少一點內捲，多一點外掛',
  description: '我是人蔘，技術主管與 AI 實驗者。分享 AI Agent 實測、工程實戰與職場觀察。探索創作、聊聊商業合作，訂閱人蔘電子報。',
  openGraph: {title: '人蔘 Try Catch｜把好奇心，做成有用的東西',description:'AI 工具、系統實作，還有一些讓工作變輕鬆的外掛。',images:[{url:'/assets/ginseng.png',width:1254,height:1254}],locale:'zh_TW',type:'website'},
  icons: {icon:'/favicon.svg'},
};
export const viewport = {themeColor: '#263f35'};
const fonts = 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap';
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="zh-Hant"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/><link rel="preconnect" href="https://i.ytimg.com"/><link rel="stylesheet" href={fonts}/></head><body>{children}</body></html>;
}
