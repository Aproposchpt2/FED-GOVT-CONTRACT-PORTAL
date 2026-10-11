// Read-only SAM.gov public entity discovery. Requires two separately configured secrets.
// SAM_API_KEY: existing SAM.gov credential; SAM_DISCOVERY_ACCESS_TOKEN: operator access.
// Never include either secret in requests to browsers, logs or response bodies.
import { timingSafeEqual } from 'node:crypto';
import { checkSession } from './_sam-session.mjs';

const respond = (status, data) => new Response(JSON.stringify(data), {
 status, headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store',
 'x-content-type-options':'nosniff' }
});
const env = key => Netlify.env.get(key) || process.env[key] || '';
const equal = (a,b) => {
 const x=Buffer.from(a), y=Buffer.from(b);
 return x.length===y.length && timingSafeEqual(x,y);
};
const naicsOf = value => {
 const entries=Array.isArray(value) ? value : [];
 return entries.map(x=>typeof x==='string'?x:(x?.naicsCode||x?.naics||x?.code||''))
 .map(String).filter(x=>/^\d{6}$/.test(x));
};
export default async function handler(req) {
 if (req.method!=='GET') return respond(405,{ok:false,error:'GET only'});
 const access=env('SAM_DISCOVERY_ACCESS_TOKEN');
 if (!access || access.length<32) return respond(503,{ok:false,error:'Operator access token not configured'});
 const supplied=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
 if (!equal(supplied,access) && !checkSession(req,access)) return respond(401,{ok:false,error:'Unauthorized'});
 const key=env('SAM_API_KEY');
 if (!key) return respond(503,{ok:false,error:'SAM.gov credential not configured'});
 const request=new URL(req.url);
 const naics=request.searchParams.get('naics')||'';
 if (!/^\d{6}$/.test(naics)) return respond(400,{ok:false,error:'A six-digit naics query is required'});
 const state=String(request.searchParams.get('state')||'CA').toUpperCase();
 if(!['CA','TX','GA'].includes(state)) return respond(400,{ok:false,error:'Unsupported state'});
 const page=Math.max(0,Math.min(100,Number.parseInt(request.searchParams.get('page')||'0',10)||0));
 const size=Math.max(1,Math.min(10,Number.parseInt(request.searchParams.get('size')||'10',10)||10));
 const upstream=new URL('https://api.sam.gov/entity-information/v4/entities');
 upstream.searchParams.set('physicalAddressProvinceOrStateCode',state);
 upstream.searchParams.set('naicsCode',naics);
 upstream.searchParams.set('registrationStatus','A');
 upstream.searchParams.set('samRegistered','Yes');
 upstream.searchParams.set('includeSections','entityRegistration,coreData,assertions');
 upstream.searchParams.set('page',String(page));
 upstream.searchParams.set('size',String(size));
 try {
  const response=await fetch(upstream,{headers:{'X-Api-Key':key,'Accept':'application/json'},
    signal:AbortSignal.timeout(22000)});
  if (!response.ok) return respond(502,{ok:false,error:'SAM.gov rejected the lookup',upstream_status:response.status});
  const json=await response.json();
  const entities=Array.isArray(json.entityData)?json.entityData:[];
  const results=entities.map(entity=>{
   const registration=entity.entityRegistration||{};
   const core=entity.coreData||{};
   const address=core.physicalAddress||{};
   const assertions=entity.assertions||{};
   const goods=assertions.goodsAndServices||{};
   const registered_naics_codes=[...new Set(naicsOf(goods.naicsList||goods.naics||[]))];
   const recordState=String(address.stateOrProvinceCode||'').toUpperCase();
   const uei=registration.ueiSAM||'';
   const legal_name=registration.legalBusinessName||'';
   const verified=recordState===state && registration.registrationStatus==='Active'
      && registered_naics_codes.includes(naics) && /^[A-Z0-9]{12}$/.test(uei) && !!legal_name;
   return {uei,legal_name,state:recordState,city:address.city||null,cage:registration.cageCode||null,
    registration_status:registration.registrationStatus||null,registered_naics_codes,
    matching_naics:naics,source:'SAM.gov Entity Management API v4',
    discovery_status:verified?'SAM_VERIFIED':'PENDING_VERIFICATION'};
  });
  return respond(200,{ok:true,naics,state:'CA',page,size,total_records:json.totalRecords??null,
     returned:results.length,verified:results.filter(x=>x.discovery_status==='SAM_VERIFIED').length,
     records:results});
 } catch { return respond(502,{ok:false,error:'SAM.gov lookup failed or timed out'}); }
}
export const config={path:'/api/sam-contractor-discovery',method:'GET',rateLimit:{action:'rate_limit',aggregateBy:'ip',windowSize:60,windowLimit:20}};
