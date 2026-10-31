// Scope sent to the private search page (action=scope). Built from the buyer-fit
// profile in sam-buyer-profile.mjs, which is the single source of codes and weights.
import { PRODUCTS, PRESETS, PARTNER_NAICS, NAICS_LABELS, PSC_LABELS, WEIGHTS, TRAFFIC_WORDS, PRODUCT_ORDER } from './sam-buyer-profile.mjs';
import { SCOPE_PROFILE_ID } from './sam-match.mjs';

export const broadProfile = {
  id: SCOPE_PROFILE_ID,
  name: 'STELLAR buyer-fit lead scope',
  productLines: PRODUCT_ORDER.map((p) => `${PRODUCTS[p].name} (${PRODUCTS[p].site})`),
  products: Object.fromEntries(PRODUCT_ORDER.map((p) => [p, {
    name: PRODUCTS[p].name, site: PRODUCTS[p].site, need: PRODUCTS[p].need,
    naics: PRODUCTS[p].naics, psc: PRODUCTS[p].psc,
  }])),
  presets: PRESETS,
  naicsCodes: PRESETS.all.naics,
  pscCodes: PRESETS.all.psc,
  naicsLabels: NAICS_LABELS,
  pscLabels: PSC_LABELS,
  partnerNaics: PARTNER_NAICS,
  weights: WEIGHTS,
  trafficWords: TRAFFIC_WORDS,
  tiers: { Strong: '60 or more', Good: '40 to 59', Weak: 'under 40', Partner: 'competitor or teaming partner' },
};
