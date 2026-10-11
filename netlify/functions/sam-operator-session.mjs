import { createHmac } from 'node:crypto';
import { secret,safeEqual,createSession,checkSession,sessionCookie,clearCookie } from './_sam-session.mjs';
const reply=(status,body,cookie)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff',...(cookie?{'set-cookie':cookie}:{})}});
export default async function handler(req){
 const key=secret();if(key.length<32)return reply(503,{ok:false,error:'Operator sign-in is not configured'});
 if(req.method==='GET')return reply(200,{ok:true,signed_in:checkSession(req,key)});
 if(req.method!=='POST')return reply(405,{ok:false,error:'GET and POST only'});
 const body=await req.json().catch(()=>({}));
 if(body.action==='command_center_sso'){
 const shared=process.env.BCP_SSO_SIGNING_SECRET||globalThis.Netlify?.env?.get('BCP_SSO_SIGNING_SECRET')||'';
 if(shared.length<32)return reply(503,{ok:false,error:'SSO signing secret not configured'});
 const parts=String(body.ticket||'').split('.');
 if(parts.length!==2||!safeEqual(parts[1],createHmac('sha256',shared).update(parts[0]).digest('base64url')))return reply(401,{ok:false,error:'Invalid SSO ticket'});
 try{
  const t=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));
  const now=Math.floor(Date.now()/1000);
  if(t.v!==1||t.aud!=='bcp-sam'||!Number.isInteger(t.exp)||t.exp<=now||t.exp>now+65||!(/^[a-f0-9]{32}$/.test(t.nonce)))return reply(401,{ok:false,error:'Expired SSO ticket'});
  return reply(200,{ok:true,signed_in:true},sessionCookie(createSession(key)));
 }catch{return reply(401,{ok:false,error:'Invalid SSO payload'});}
 }
 if(body.action==='logout')return reply(200,{ok:true,signed_in:false},clearCookie());
 if(body.action!=='login'||typeof body.token!=='string')return reply(400,{ok:false,error:'Invalid sign-in request'});
 if(!safeEqual(body.token,key))return reply(401,{ok:false,error:'Incorrect operator token'});
 return reply(200,{ok:true,signed_in:true},sessionCookie(createSession(key)));
}
export const config={path:'/api/sam-operator-session',rateLimit:{action:'rate_limit',aggregateBy:'ip',windowSize:60,windowLimit:10}};
