// Buyer-fit lead scope for the private SAM.gov contractor search.
//
// Finds contractors who would BUY a Stellar product: businesses whose own work
// creates a steady stream of inbound calls, service requests, work orders or
// dispatches. Codes come from "SAM Lead Scope - Buyer NAICS & PSC Codes"
// (approved 31 Oct 2026). Every PSC code below was checked active in the official
// acquisition.gov "PSC April 2025.xlsx"; NAICS titles follow 2022 NAICS.
//
// Scoring uses only what SAM returns (registered NAICS, PSC, descriptions, website).

export const PRODUCTS = {
  pma: {
    name: 'PMA',
    fullName: 'Property Management Assistant',
    site: 'pma.stellaruc.com',
    need: 'Tenant maintenance calls, case intake and vendor dispatch',
    naics: {
      core: { '531311': 'Residential Property Managers', '531312': 'Nonresidential Property Managers', '531110': 'Lessors of Residential Buildings and Dwellings' },
      extended: { '813990': 'Other Similar Organizations (incl. HOAs and condo associations)' },
    },
    psc: {
      core: { M1FA: 'Operation of Family Housing Facilities', Z1FA: 'Maintenance of Family Housing Facilities', Z2FA: 'Repair or Alteration of Family Housing Facilities' },
      extended: { Z1JZ: 'Maintenance of Miscellaneous Buildings', Z1FC: 'Maintenance of Troop Housing Facilities', M1FC: 'Operation of Troop Housing Facilities' },
    },
  },
  support: {
    name: 'Support Specialist',
    fullName: 'Support Specialist',
    site: 'specialist.stellaruc.com',
    need: 'Service and support calls, ticket creation and dispatch',
    naics: {
      core: { '238220': 'Plumbing, Heating, and Air-Conditioning Contractors', '238210': 'Electrical Contractors and Other Wiring Installation Contractors', '561210': 'Facilities Support Services' },
      extended: { '561720': 'Janitorial Services', '561710': 'Exterminating and Pest Control Services', '238160': 'Roofing Contractors', '238290': 'Other Building Equipment Contractors', '541513': 'Computer Facilities Management Services' },
    },
    psc: {
      core: { J041: 'Maint/Repair of Refrigeration, Air Conditioning and Air Circulating Equipment', J045: 'Maint/Repair of Plumbing, Heating and Waste Disposal Equipment', S216: 'Housekeeping - Facilities Operations Support' },
      extended: { S201: 'Housekeeping - Custodial Janitorial', S207: 'Housekeeping - Insect/Rodent Control', J063: 'Maint/Repair of Alarm, Signal and Security Detection Systems', DE01: 'IT and Telecom - End User: Help Desk; Tier 1-2 (Labor)' },
    },
  },
  sales: {
    name: 'Sales Specialist',
    fullName: 'Sales Specialist',
    site: 'sales.stellaruc.com',
    need: 'Inbound sales and quote calls, lead capture',
    naics: {
      core: { '236118': 'Residential Remodelers', '561730': 'Landscaping Services', '561621': 'Security Systems Services (except Locksmiths)' },
      extended: { '236220': 'Commercial and Institutional Building Construction', '561612': 'Security Guards and Patrol Services' },
    },
    psc: {
      core: {},
      extended: { S208: 'Housekeeping - Landscaping/Groundskeeping', S206: 'Housekeeping - Guard' },
    },
  },
  platform: {
    name: 'Stellar Platform',
    fullName: 'Stellar platform (contact centre, CRM and case tracking)',
    site: 'stellaruc.com',
    need: 'Contact-centre, CRM and case tracking for multi-site operations',
    naics: {
      core: { '561320': 'Temporary Help Services', '561210': 'Facilities Support Services' },
      extended: { '811310': 'Commercial and Industrial Machinery and Equipment Repair and Maintenance' },
    },
    psc: {
      core: {},
      extended: { S299: 'Housekeeping - Other' },
    },
  },
};

// Primary NAICS that make a contractor a competitor or partner rather than a buyer.
export const PARTNER_NAICS = {
  '561421': 'Telephone Answering Services',
  '561422': 'Telemarketing Bureaus and Other Contact Centers',
  '561110': 'Office Administrative Services',
  '541512': 'Computer Systems Design Services',
  '541519': 'Other Computer Related Services',
};

export const TRAFFIC_WORDS = ['service call', 'repair', 'maintenance', 'emergency', '24/7', 'dispatch', 'work order', 'tenant', 'property management'];
export const WEIGHTS = { primaryCore: 40, primaryExtended: 25, secondary: 10, pscCore: 25, pscExtended: 15, trafficWord: 5, trafficMax: 15, website: 10 };
export const PRODUCT_ORDER = ['support', 'pma', 'sales', 'platform']; // tie-break: strongest fit first

export const tierFor = (score) => (score >= 60 ? 'Strong' : score >= 40 ? 'Good' : 'Weak');

const unique = (xs) => [...new Set(xs)];
export const productNaics = (p) => Object.keys({ ...PRODUCTS[p].naics.core, ...PRODUCTS[p].naics.extended });
export const productPsc = (p) => Object.keys({ ...PRODUCTS[p].psc.core, ...PRODUCTS[p].psc.extended });

// Search presets: each product, plus all products together.
export const PRESETS = {
  all: { label: 'All Stellar products · buyers', naics: unique(PRODUCT_ORDER.flatMap(productNaics)), psc: unique(PRODUCT_ORDER.flatMap(productPsc)) },
  ...Object.fromEntries(PRODUCT_ORDER.map((p) => [p, { label: `${PRODUCTS[p].name} buyers (${PRODUCTS[p].site})`, naics: productNaics(p), psc: productPsc(p) }])),
};

export const NAICS_LABELS = Object.assign({}, ...PRODUCT_ORDER.flatMap((p) => [PRODUCTS[p].naics.core, PRODUCTS[p].naics.extended]), PARTNER_NAICS);
export const PSC_LABELS = Object.assign({}, ...PRODUCT_ORDER.flatMap((p) => [PRODUCTS[p].psc.core, PRODUCTS[p].psc.extended]));

const lower = (s) => String(s || '').toLowerCase();

// Scores one product. Returns { score, reasons }.
function scoreProduct(p, { primary, codes, psc, descriptions, website }) {
  const prod = PRODUCTS[p], reasons = [];
  let score = 0;
  if (primary && prod.naics.core[primary]) { score += WEIGHTS.primaryCore; reasons.push(`Primary NAICS ${primary} is a core ${prod.name} buyer code (+${WEIGHTS.primaryCore})`); }
  else if (primary && prod.naics.extended[primary]) { score += WEIGHTS.primaryExtended; reasons.push(`Primary NAICS ${primary} is an extended ${prod.name} buyer code (+${WEIGHTS.primaryExtended})`); }
  const secondary = codes.filter((c) => c !== primary && (prod.naics.core[c] || prod.naics.extended[c]));
  if (secondary.length) { score += WEIGHTS.secondary; reasons.push(`Also registered under ${secondary.join(', ')} (+${WEIGHTS.secondary})`); }
  const pscCore = psc.filter((c) => prod.psc.core[c]), pscExt = psc.filter((c) => prod.psc.extended[c]);
  if (pscCore.length) { score += WEIGHTS.pscCore; reasons.push(`PSC ${pscCore.join(', ')} is a core ${prod.name} code (+${WEIGHTS.pscCore})`); }
  else if (pscExt.length) { score += WEIGHTS.pscExtended; reasons.push(`PSC ${pscExt.join(', ')} is an extended ${prod.name} code (+${WEIGHTS.pscExtended})`); }
  const codeMatch = score > 0;
  if (codeMatch) {
    const text = lower(descriptions.join(' '));
    const words = TRAFFIC_WORDS.filter((w) => text.includes(w));
    const pts = Math.min(WEIGHTS.trafficMax, words.length * WEIGHTS.trafficWord);
    if (pts) { score += pts; reasons.push(`Service-traffic words in registered descriptions: ${words.join(', ')} (+${pts})`); }
    if (website) { score += WEIGHTS.website; reasons.push(`Website listed in SAM: ${website} (+${WEIGHTS.website})`); }
  }
  return { score: Math.min(100, score), reasons, codeMatch };
}

// record: { primary_naics, registered_naics_codes, psc_codes, capability_profile }
export function buyerFit(record, website = null) {
  const primary = record.primary_naics || null;
  const codes = record.registered_naics_codes || [];
  const psc = record.psc_codes || [];
  const descriptions = (record.capability_profile || []).map((c) => c.description).filter(Boolean);
  const helpDesk = psc.includes('DE01');
  if (primary && PARTNER_NAICS[primary] && !helpDesk) {
    return { product: null, product_name: 'Partner', tier: 'Partner', score: 0, reasons: [`Primary NAICS ${primary} (${PARTNER_NAICS[primary]}) offers services like Stellar's: competitor or teaming partner, not a buyer`], website };
  }
  let best = null;
  for (const p of PRODUCT_ORDER) {
    const r = scoreProduct(p, { primary, codes, psc, descriptions, website });
    if (r.codeMatch && (!best || r.score > best.score)) best = { p, ...r };
  }
  if (!best) return { product: null, product_name: 'No buyer match', tier: 'Weak', score: 0, reasons: ['No registered NAICS or PSC matches a Stellar buyer code'], website };
  const reasons = [...best.reasons];
  if (primary && PARTNER_NAICS[primary] && helpDesk) reasons.unshift(`Primary NAICS ${primary} is normally a partner code, but PSC DE01 shows it runs a help desk`);
  return { product: best.p, product_name: PRODUCTS[best.p].name, tier: tierFor(best.score), score: best.score, reasons, website };
}
