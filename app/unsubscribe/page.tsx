import { UnsubscribeForm } from '../components/forms';
export const metadata = {title:'退訂電子報｜人蔘 Try Catch', robots:{index:false,follow:false}};
export default async function Unsubscribe({searchParams}: {searchParams: Promise<{token?:string}>}) { const {token} = await searchParams; return <main className="subpage"><a href="/">回到首頁</a><h1>先在這裡，下車也沒關係。</h1><UnsubscribeForm token={typeof token === 'string' ? token : ''}/></main>; }
