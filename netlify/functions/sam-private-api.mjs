import { query, contractors } from './sam-search-core.mjs';
const OWNER='jmitchell@aproposgroupllc.com';
const env=k=>globalThis.Netlify?.env?.get(k)||process.env[k]||'';
const reply=(status,data,cookie)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-robots-tag':'noindex, nofollow',...(cookie?{'set-cookie':cookie}:{})}});
const cookie=(t,age=604800)=>`__Host-sam_owner=${t}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${age}`;
async function db(path,options={}){const key=env('SUPABASE_SERVICE_KEY')||env('SUPABASE_SERVICE_ROLE_KEY');if(!key||!env('SUPABASE_URL'))throw Error('Database not configured');return fetch(env('SUPABASE_URL')+'/rest/v1/'+path,{...options,headers:{apikey:key,Authorization:`Bearer ${key}`,'content-type':'application/json',...options.headers},signal:AbortSignal.timeout(15000)});}
export async function owner(token){if(!/^[a-f0-9-]{36}$/i.test(token||''))return false;const r=await db(`client_sessions?session_token=eq.${encodeURIComponent(token)}&revoked=eq.false&select=email,expires_at&limit=1`);if(!r.ok)throw Error('Session validation unavailable');const [s]=await r.json();return s?.email?.toLowerCase()===OWNER&&new Date(s.expires_at)>new Date();}
export default async function handler(req){try{
 const url=new URL(req.url);const action=url.searchParams.get('action')||'leads';
 if(req.method==='POST'&&req.headers.get('origin')!==url.origin)return reply(403,{error:'Same-origin request required'});
 if(action==='login'&&req.method==='POST'){const b=await req.json();if(!await owner(b.session_token))return reply(403,{error:'Owner session required. Sign in to the portal with your owner email.'});return reply(200,{ok:true},cookie(b.session_token));}
 const token=(req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('__Host-sam_owner='))?.split('=')[1];
 if(!await owner(token))return reply(401,{error:'Owner sign-in required'});
 if(action==='logout'&&req.method==='POST')return reply(200,{ok:true},cookie('',0));
 if(action==='leads'&&req.method==='GET'){const r=await db('sam_contractor_leads?select=*&order=discovered_at.desc&limit=150');if(!r.ok)throw Error('Leads table unavailable');return reply(200,{records:await r.json()});}
 if(action!=='search'||req.method!=='POST')return reply(405,{error:'Unsupported operation'});
 const filters=await req.json();if(![50,100,150].includes(Number(filters.target)))return reply(400,{error:'Target must be 50, 100, or 150'});
 const key=env('SAM_GOV_API_KEY')||env('SAM_API_KEY');if(!key)throw Error('SAM.gov key not configured');
 let params;try{params=query(filters,key);}catch(e){return reply(400,{error:e.message});}
 const upstream=await fetch('https://api.sam.gov/opportunities/v2/search?'+params,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(22000)});
 if(!upstream.ok)return reply(502,{error:'SAM.gov search rejected',upstream_status:upstream.status});
 const data=await upstream.json();if(!Array.isArray(data.opportunitiesData))throw Error('Unexpected SAM.gov response');
 const excluded=new Set(Array.isArray(filters.seen)?filters.seen.slice(0,150):[]);const records=contractors(data.opportunitiesData).filter(r=>!excluded.has(r.contractor_key)).slice(0,Math.max(0,Number(filters.target)-excluded.size));
 if(records.length){const saved=await db('sam_contractor_leads?on_conflict=contractor_key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(records)});if(!saved.ok)throw Error('Could not save discovered contractors');}
 return reply(200,{records,scanned:data.opportunitiesData.length,totalRecords:data.totalRecords||0,page:Number(filters.page||0),exhausted:data.opportunitiesData.length<50||(Number(filters.page||0)+1)*50>=Number(data.totalRecords||0)});
 }catch{return reply(503,{error:'Search service unavailable. Check deployment configuration, database, or upstream timeout.'});}}
export const config={path:'/api/private-sam',rateLimit:{action:'rate_limit',aggregateBy:'ip',windowSize:60,windowLimit:30}};
