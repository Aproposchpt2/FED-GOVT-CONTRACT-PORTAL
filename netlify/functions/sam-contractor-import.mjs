import {checkSession,secret} from './_sam-session.mjs';
const HOST='https://pwvstaigtdrccirdvqka.supabase.co';
const reply=(s,obj)=>new Response(JSON.stringify(obj),{status:s,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
const cred=()=>Netlify.env.get('BCP_SUPABASE_SERVICE_ROLE_KEY')||process.env.BCP_SUPABASE_SERVICE_ROLE_KEY||'';
const API='/rest/v1/';
async function query(table,ueis,key){
 const names=ueis.map(x=>'"'+x+'"').join(',');
 const params=new URLSearchParams({select:table==='bcp_outreach_match_ready'?'contractor_uei':'uei'});
 params.set((table==='bcp_outreach_match_ready'?'contractor_uei':'uei'),'in.('+names+')');
 const res=await fetch(HOST+API+table+'?'+params,{headers:{apikey:key,Authorization:'Bearer '+key,Accept:'application/json'},signal:AbortSignal.timeout(15000)});
 if(!res.ok)throw Error('Database lookup failed: '+table+' HTTP '+res.status);
 return await res.json();
}
export default async function handler(req){
 if(req.method!=='POST')return reply(405,{ok:false,error:'POST only'});
 const url=new URL(req.url);
 if(req.headers.get('origin')!==url.origin)return reply(403,{ok:false,error:'Same-origin request required'});
 const auth=secret();
 if(auth.length<32||!checkSession(req,auth))return reply(401,{ok:false,error:'Operator sign-in required'});
 const key=cred();
 if(!key)return reply(503,{ok:false,error:'BCP_SUPABASE_SERVICE_ROLE_KEY is not configured for Netlify Functions'});
 const length=Number(req.headers.get('content-length')||0);
 if(length>900000)return reply(413,{ok:false,error:'Maximum upload size is 900 KB'});
 let body;try{body=await req.json()}catch{return reply(400,{ok:false,error:'Invalid JSON'})}
 const batch=body?.batch_id,records=body?.records;
 if(!/^CA-SAM-\d{3}$/.test(batch||'')||!Array.isArray(records)||records.length<1||records.length>150)return reply(400,{ok:false,error:'Expected batch ID and 1–150 records'});
 const seen=new Set(),accepted=[],invalid=[];
 for(let i=0;i<records.length;i++){
   const r=records[i]||{},codes=r.registered_naics_codes,matches=r.matched_contract_naics;
   const valid=/^[A-Z0-9]{12}$/.test(r.uei||'')&&typeof r.legal_name==='string'&&r.legal_name.trim().length>1&&r.legal_name.length<500&&r.state==='CA'&&r.registration_status==='Active'&&r.discovery_status==='SAM_VERIFIED'&&
   Array.isArray(codes)&&codes.length>0&&codes.length<300&&codes.every(c=>typeof c==='string'&&/^\d{6}$/.test(c))&&Array.isArray(matches)&&matches.length>0&&matches.length<=20&&matches.every(c=>typeof c==='string'&&codes.includes(c))&&(!r.matching_naics||matches.includes(r.matching_naics));
   if(!valid||seen.has(r.uei)){invalid.push({index:i+1,reason:valid?'Duplicate UEI within upload':'Invalid registration, UEI or NAICS'});continue}
   seen.add(r.uei);
   accepted.push({discovery_batch_id:batch,uei:r.uei,legal_name:r.legal_name.trim(),state:'CA',city:typeof r.city==='string'?r.city.slice(0,150):null,entity_cage_code:typeof r.cage==='string'?r.cage.slice(0,20):null,registered_naics_codes:[...new Set(codes)],matched_contract_naics:[...new Set(matches)],sam_registration_status:'Active',discovery_status:'SAM_VERIFIED',email_discovery_status:'NOT_STARTED',research_notes:'Imported via authenticated SAM.gov discovery console; source assertions require independent validation before outreach',source_payload:{source:r.source||'SAM.gov Entity Management API v4',batch_id:batch,uei:r.uei,matching_naics:r.matching_naics}});
 }
 if(invalid.length)return reply(422,{ok:false,error:'Import rejected: all records must pass validation',invalid:invalid.slice(0,30),total_invalid:invalid.length});
 const ueis=accepted.map(x=>x.uei);
 try{
   const [staging,active,assigned]=await Promise.all([query('bcp_temp_sam_gov_contractors',ueis,key),query('sam_active_contractors',ueis,key),query('bcp_outreach_match_ready',ueis,key)]);
   const excluded=new Set([...staging.map(x=>x.uei),...active.map(x=>x.uei),...assigned.map(x=>x.contractor_uei)]);
   const candidates=accepted.filter(x=>!excluded.has(x.uei));
   if(body.dry_run!==false)return reply(200,{ok:true,dry_run:true,batch_id:batch,received:records.length,eligible:candidates.length,excluded_existing:accepted.length-candidates.length,existing_staging:staging.length,existing_active:active.length,existing_assignments:assigned.length,imported:0});
   if(candidates.length===0)return reply(200,{ok:true,dry_run:false,batch_id:batch,received:records.length,eligible:0,excluded_existing:accepted.length,imported:0});
   const res=await fetch(HOST+API+'bcp_temp_sam_gov_contractors?on_conflict=uei',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify(candidates),signal:AbortSignal.timeout(25000)});
   if(!res.ok)return reply(502,{ok:false,error:'Supabase staging insert failed',upstream_status:res.status});
   const inserted=await res.json();
   return reply(200,{ok:true,dry_run:false,batch_id:batch,received:records.length,eligible:candidates.length,excluded_existing:accepted.length-candidates.length,imported:inserted.length,already_present_or_conflicted:candidates.length-inserted.length});
 }catch(e){return reply(502,{ok:false,error:'Supabase lookup/import unavailable; nothing else was intentionally changed',detail:String(e.message||'').slice(0,180)})}
}
export const config={path:'/api/sam-contractor-import',rateLimit:{action:'rate_limit',aggregateBy:'ip',windowSize:60,windowLimit:8}};
