import {cookies} from 'next/headers';import crypto from 'node:crypto';
const C='azb_admin';
function secret(){const s=process.env.AUTH_SECRET;if(!s)throw new Error('AUTH_SECRET missing');return s}
function sig(v:string){return crypto.createHmac('sha256',secret()).update(v).digest('hex')}
export async function session(){
  const v=(await cookies()).get(C)?.value;if(!v||!process.env.AUTH_SECRET)return false;
  const [p,s]=v.split('.');if(!p||!s)return false;
  const expected=sig(p),a=Buffer.from(expected),b=Buffer.from(s);if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return false;
  try{const data=JSON.parse(Buffer.from(p,'base64url').toString());return typeof data.x==='number'&&data.x>Date.now()}catch{return false}
}
export async function setSession(){
  if(!process.env.AUTH_SECRET)throw new Error('AUTH_SECRET missing');
  const c=await cookies();const p=Buffer.from(JSON.stringify({e:process.env.ADMIN_EMAIL||'jekboger2@gmail.com',x:Date.now()+1000*60*60*24*7})).toString('base64url');
  c.set(C,`${p}.${sig(p)}`,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:604800});
}
export async function clearSession(){(await cookies()).set(C,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0})}
export function hash(p:string,s=crypto.randomBytes(16).toString('hex')){return `${s}:${crypto.scryptSync(p,s,64).toString('hex')}`}
export function verify(p:string,h:string){const [s,x]=h.split(':');if(!s||!x)return false;const a=crypto.scryptSync(p,s,64),b=Buffer.from(x,'hex');return a.length===b.length&&crypto.timingSafeEqual(a,b)}