import resultsTools from '../../private-sam/results-tools.js';
import { scoringScope, scoreContractor } from './sam-match.mjs';
export function query(filters,key){
 filters={...filters,state:resultsTools.normalizeState(filters.state)};
 const page=Number(filters.page||0);if(!Number.isInteger(page)||page<0||page>99)throw Error('Invalid page');
 if(!filters.naics&&!filters.psc)throw Error('Select a six-digit NAICS or PSC code');if(filters.naics&&!/^\d{6}$/.test(filters.naics))throw Error('Invalid NAICS code');scoringScope(filters);
 for(const [key,pattern] of [['selectedNaics',/^\d{6}$/],['selectedPsc',/^[A-Z0-9]{4}$/]])if(filters[key]!==undefined&&(!Array.isArray(filters[key])||filters[key].length>20||filters[key].some(c=>typeof c!=='string'||!pattern.test(c))))throw Error('Invalid selected scope');
 const q=new URLSearchParams({api_key:key,registrationStatus:'A',samRegistered:'Yes',includeSections:'entityRegistration,coreData,assertions',page:String(page),size:'10'});
 if(filters.naics)q.set('naicsCode',filters.naics);
 for(const [field,param,pattern] of [['state','physicalAddressProvinceOrStateCode',/^[A-Z]{2}$/],['keyword','naicsDesc',/^.{1,120}$/],['psc','pscCode',/^[A-Z0-9]{4}$/]])if(filters[field]){if(!pattern.test(filters[field]))throw Error(`Invalid ${field}`);q.set(param,filters[field]);}
 return q;
}
export function contractors(entities,filters){filters={...filters,state:resultsTools.normalizeState(filters.state)};const found=new Map();for(const e of entities){const r=e.entityRegistration||{},address=e.coreData?.physicalAddress||{},goods=e.assertions?.goodsAndServices||{};
 const capabilities=(goods.naicsList||[]).map(n=>({code:String(n.naicsCode||''),description:n.naicsDescription||''})).filter(n=>/^\d{6}$/.test(n.code));
 const codes=[...new Set([goods.primaryNaics,...capabilities.map(n=>n.code)].filter(n=>/^\d{6}$/.test(n||'')))];
 const matching=codes.filter(n=>(filters.selectedNaics||[filters.naics]).includes(n));
 const psc=[...new Set((goods.pscList||[]).map(n=>String(n.pscCode||n.psc||'')).filter(c=>/^[A-Z0-9]{4}$/.test(c)))];
 const primary=/^\d{6}$/.test(String(goods.primaryNaics||''))?String(goods.primaryNaics):null;
 if(!/^[A-Z0-9]{12}$/.test(r.ueiSAM||'')||!r.legalBusinessName?.trim()||r.samRegistered!=='Yes'||r.registrationStatus!=='Active'||(filters.naics?!matching.includes(filters.naics):!psc.includes(filters.psc)))continue;
 if(filters.state&&String(address.stateOrProvinceCode||'').trim().toUpperCase()!==filters.state)continue;
 if(filters.keyword&&!capabilities.some(n=>n.description.toLowerCase().includes(filters.keyword.toLowerCase())))continue;
 if(filters.psc&&!psc.includes(filters.psc))continue;
 const record={contractor_key:r.ueiSAM,legal_name:r.legalBusinessName.trim(),uei:r.ueiSAM,city:address.city||null,state:address.stateOrProvinceCode||null,naics:filters.naics||matching[0]||null,primary_naics:primary,secondary_naics_codes:primary?codes.filter(c=>c!==primary):[],psc_codes:psc,source_notice_id:null,source_url:'https://sam.gov/entity-information',source_type:'sam_entity_v4',registered_naics_codes:codes,matching_naics_codes:matching,capability_profile:[...capabilities,...(goods.pscList||[]).map(p=>({code:p.pscCode||p.psc,description:p.pscDescription||'',kind:'PSC'}))],registration_status:r.registrationStatus,cage:r.cageCode||null,discovered_at:new Date().toISOString()};const evidence=scoreContractor(record,psc,filters);if(evidence.fit_score<scoringScope(filters).minimumScore)continue;found.set(r.ueiSAM,{...record,...evidence});}
 return [...found.values()].sort((a,b)=>b.fit_score-a.fit_score);}
