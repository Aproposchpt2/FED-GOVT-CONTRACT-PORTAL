export function query(filters,key){
 const page=Number(filters.page||0);if(!Number.isInteger(page)||page<0||page>99)throw Error('Invalid page');
 if(!/^\d{6}$/.test(filters.naics||''))throw Error('Select a six-digit NAICS code');
 const q=new URLSearchParams({api_key:key,naicsCode:filters.naics,registrationStatus:'A',samRegistered:'Yes',includeSections:'entityRegistration,coreData,assertions',page:String(page),size:'10'});
 for(const [field,param,pattern] of [['state','physicalAddressProvinceOrStateCode',/^[A-Z]{2}$/],['keyword','naicsDesc',/^.{1,120}$/],['psc','pscCode',/^[A-Z0-9]{4}$/]])if(filters[field]){if(!pattern.test(filters[field]))throw Error(`Invalid ${field}`);q.set(param,filters[field]);}
 return q;
}
export function contractors(entities,filters){const found=new Map();for(const e of entities){const r=e.entityRegistration||{},address=e.coreData?.physicalAddress||{},goods=e.assertions?.goodsAndServices||{};
 const capabilities=(goods.naicsList||[]).map(n=>({code:String(n.naicsCode||''),description:n.naicsDescription||''})).filter(n=>/^\d{6}$/.test(n.code));
 const codes=[...new Set([goods.primaryNaics,...capabilities.map(n=>n.code)].filter(n=>/^\d{6}$/.test(n||'')))];
 const matching=codes.filter(n=>(filters.selectedNaics||[filters.naics]).includes(n));
 if(!/^[A-Z0-9]{12}$/.test(r.ueiSAM||'')||!r.legalBusinessName?.trim()||r.samRegistered!=='Yes'||r.registrationStatus!=='Active'||!matching.includes(filters.naics))continue;
 if(filters.state&&address.stateOrProvinceCode!==filters.state)continue;
 if(filters.keyword&&!capabilities.some(n=>n.description.toLowerCase().includes(filters.keyword.toLowerCase())))continue;
 const psc=(goods.pscList||[]).map(n=>String(n.pscCode||n.psc||''));if(filters.psc&&!psc.includes(filters.psc))continue;
 found.set(r.ueiSAM,{contractor_key:r.ueiSAM,legal_name:r.legalBusinessName.trim(),uei:r.ueiSAM,city:address.city||null,state:address.stateOrProvinceCode||null,naics:filters.naics,source_notice_id:null,source_url:'https://sam.gov/entity-information',source_type:'sam_entity_v4',registered_naics_codes:codes,matching_naics_codes:matching,capability_profile:capabilities,registration_status:r.registrationStatus,cage:r.cageCode||null,discovered_at:new Date().toISOString()});}
 return [...found.values()];}
