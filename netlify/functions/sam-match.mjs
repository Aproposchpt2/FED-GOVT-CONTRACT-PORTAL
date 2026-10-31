// Buyer-fit scoring for the private SAM.gov contractor search. See sam-buyer-profile.mjs.
// Output keeps the existing sam_contractor_leads fields (fit_score, match_evidence,
// matched_capabilities, capability_status) so saved rows and the UI stay compatible.
import { buyerFit, PRESETS } from './sam-buyer-profile.mjs';

export const SCOPE_PROFILE_ID = 'stellar-buyer-fit-v1';

export function scoringScope(filters = {}) {
  const minimumScore = Number(filters.minimumScore ?? 0);
  if (!Number.isInteger(minimumScore) || minimumScore < 0 || minimumScore > 100) throw Error('Invalid minimum score');
  const preset = filters.preset ?? 'all';
  if (typeof preset !== 'string' || !(preset in PRESETS || preset === 'owner')) throw Error('Invalid scope preset');
  return { minimumScore, preset };
}

export function scoreContractor(record, psc, filters, website = null) {
  const scope = scoringScope(filters);
  const fit = buyerFit({ ...record, psc_codes: psc }, website);
  const matchingPsc = psc.filter((c) => (filters.selectedPsc || []).includes(c));
  return {
    scope_profile_id: SCOPE_PROFILE_ID,
    fit_score: fit.score,
    match_evidence: {
      product: fit.product,
      productName: fit.product_name,
      tier: fit.tier,
      website: fit.website,
      matchedProductLines: fit.product ? [fit.product_name] : [],
      matchedPsc: matchingPsc,
      registeredPsc: psc,
      reasons: fit.reasons,
      scope: { preset: scope.preset, naics: filters.selectedNaics || [filters.naics].filter(Boolean), psc: filters.selectedPsc || [], minimumScore: scope.minimumScore, state: filters.state || null },
      sourceFields: ['assertions.goodsAndServices.primaryNaics', 'assertions.goodsAndServices.naicsList', 'assertions.goodsAndServices.pscList', 'coreData.entityInformation.entityURL'],
      evidenceLimit: 'Buyer fit from registered SAM classifications, descriptions and website only; call volume and buying intent unverified',
    },
    matched_capabilities: fit.product ? [fit.product_name] : [],
    capability_status: fit.tier === 'Partner' ? 'PARTNER' : fit.product ? 'BUYER_FIT' : 'UNVERIFIED',
  };
}
