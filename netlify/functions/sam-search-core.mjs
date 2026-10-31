import { createHash } from 'node:crypto';
export function query(filters, key) {
 const date=(v)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(v||''))throw Error('Choose valid dates');const d=new Date(v+'T00:00:00Z');if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==v)throw Error('Invalid date');return d;};
 const from=date(filters.postedFrom),to=date(filters.postedTo),max=new Date(from);max.setUTCFullYear(max.getUTCFullYear()+1);
 if(to<from||to>max)throw Error('Date window must be ordered and no more than one year');
 const fmt=d=>`${String(d.getUTCMonth()+1).padStart(2,'0')}/${String(d.getUTCDate()).padStart(2,'0')}/${d.getUTCFullYear()}`;
 const page=Number(filters.page||0);if(!Number.isInteger(page)||page<0||page>19)throw Error('Invalid page');
 const q=new URLSearchParams({api_key:key,postedFrom:fmt(from),postedTo:fmt(to),limit:'50',offset:String(page)});
 for(const [field,param,pattern] of [['keyword','title',/^.{1,200}$/],['naics','ncode',/^\d{2,6}$/],['state','state',/^[A-Z]{2}$/],['setAside','typeOfSetAside',/^[A-Za-z0-9]{1,15}$/],['noticeType','ptype',/^[uparsogki]$/],['solicitationNumber','solnum',/^.{1,128}$/]]){if(filters[field]){if(!pattern.test(filters[field]))throw Error(`Invalid ${field}`);q.set(param,filters[field]);}}
 if(!filters.noticeType)q.set('ptype','a');return q;
}
export function contractors(notices){const records=new Map();for(const n of notices){const a=n.award?.awardee;if(!a?.name?.trim()||!n.noticeId)continue;const uei=/^[A-Z0-9]{12}$/.test(a.ueiSAM||'')?a.ueiSAM:null;const loc=a.location||{};const name=a.name.trim();const key=uei||createHash('sha256').update(JSON.stringify([name.toLowerCase(),loc])).digest('hex');if(records.has(key))continue;records.set(key,{contractor_key:key,legal_name:name,uei,city:loc.city?.name||null,state:loc.state?.code||null,naics:n.naicsCode||null,source_notice_id:n.noticeId,opportunity_title:n.title||null,award_number:n.award.number||null,award_amount:Number.isFinite(Number(n.award.amount))?Number(n.award.amount):null,source_url:`https://sam.gov/opp/${encodeURIComponent(n.noticeId)}/view`,discovered_at:new Date().toISOString()});}return [...records.values()];}
