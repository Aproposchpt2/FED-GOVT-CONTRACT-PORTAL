import { broadProfile } from './sam-broad-profile.mjs';
const clean=s=>String(s||'').toLowerCase().replace(/[^a-z0-9/]+/g,' ').replace(/\s+/g,' ').trim();
const contains=(text,phrase)=>(' '+clean(text)+' ').includes(' '+clean(phrase)+' ');
export function scoringScope(filters={}){
 const groups=filters.capabilityGroups??Object.keys(broadProfile.capabilityGroups);
 if(!Array.isArray(groups)||groups.some(g=>!Object.hasOwn(broadProfile.capabilityGroups,g)))throw Error('Invalid capability group');
 const phrases=(name,fallback)=>{const values=filters[name]??fallback;if(!Array.isArray(values)||values.length>80||values.some(p=>typeof p!=='string'||!p.trim()||p.length>120))throw Error(`Invalid ${name}`);return [...new Set(values.map(p=>p.trim()))];};
 const minimumScore=Number(filters.minimumScore??0);if(!Number.isInteger(minimumScore)||minimumScore<0||minimumScore>1000)throw Error('Invalid minimum score');
 return {groups,include:phrases('includePhrases',broadProfile.includePhrases),exclude:phrases('excludePhrases',broadProfile.excludePhrases),minimumScore};
}
export function scoreContractor(record,psc,filters){
 const scope=scoringScope(filters),descriptions=(record.capability_profile||[]).map(n=>n.description).filter(Boolean),body=descriptions.join(' ');
 const included=scope.include.filter(p=>descriptions.some(d=>contains(d,p))),excluded=scope.exclude.filter(p=>descriptions.some(d=>contains(d,p)));
 const capabilities=scope.groups.filter(g=>broadProfile.capabilityGroups[g].some(p=>descriptions.some(d=>contains(d,p))));
 const matchingPsc=psc.filter(c=>(filters.selectedPsc||[]).includes(c));let score=0;const reasons=[];
 if(record.matching_naics_codes.length){score+=broadProfile.weights.naicsMatch;reasons.push(`Registered NAICS match (+${broadProfile.weights.naicsMatch}): ${record.matching_naics_codes.join(', ')}`);}
 if(matchingPsc.length){score+=broadProfile.weights.pscMatch;reasons.push(`Registered PSC match (+${broadProfile.weights.pscMatch}): ${matchingPsc.join(', ')}`);}
 for(const phrase of included){score+=broadProfile.weights.bodyPhrase;reasons.push(`Registered description phrase (+${broadProfile.weights.bodyPhrase}): ${phrase}`);}
 for(const phrase of excluded){score-=broadProfile.weights.exclusionPenalty;reasons.push(`Exclusion phrase (-${broadProfile.weights.exclusionPenalty}): ${phrase}`);}
 const status=capabilities.length?'DESCRIPTION_EVIDENCE':'UNVERIFIED';
 if(!capabilities.length)reasons.push('Selected capability groups unverified in available registered descriptions');
 return {scope_profile_id:broadProfile.id,fit_score:score,match_evidence:{matchedTerms:included,excludedTerms:excluded,matchedPsc:matchingPsc,registeredPsc:psc,reasons,scope:{naics:filters.selectedNaics||[filters.naics].filter(Boolean),psc:filters.selectedPsc||[],groups:scope.groups,includePhrases:scope.include,excludePhrases:scope.exclude,minimumScore:scope.minimumScore,state:filters.state||null},sourceFields:['assertions.goodsAndServices.naicsList','assertions.goodsAndServices.pscList'],evidenceLimit:'Registered classifications/descriptions only; full capability statement and past performance unverified'},matched_capabilities:capabilities,capability_status:status};
}
