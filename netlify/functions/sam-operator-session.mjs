import { secret,safeEqual,createSession,checkSession,sessionCookie,clearCookie } from './_sam-session.mjs';
const reply=(status,body,cookie)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff',...(cookie?{'set-cookie':cookie}:{})}});
export default async function handler(req){
 const key=secret();if(key.length<32)return reply(503,{ok:false,error:'Operator sign-in is not configured'});
 if(req.method==='GET')return reply(200,{ok:true,signed_in:checkSession(req,key)});
 if(req.method!=='POST')return reply(405,{ok:false,error:'GET and POST only'});
 const body=await req.json().catch(()=>({}));
 if(body.action==='logout')return reply(200,{ok:true,signed_in:false},clearCookie());
 if(body.action!=='login'||typeof body.token!=='string')return reply(400,{ok:false,error:'Invalid sign-in request'});
 if(!safeEqual(body.token,key))return reply(401,{ok:false,error:'Incorrect operator token'});
 return reply(200,{ok:true,signed_in:true},sessionCookie(createSession(key)));
}
export const config={path:'/api/sam-operator-session',rateLimit:{action:'rate_limit',aggregateBy:'ip',windowSize:60,windowLimit:10}};
