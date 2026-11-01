// Email discovery for SAM contractor leads (owner-only, via sam-private-api).
//
// A SAM lead becomes an outreach candidate only after a PERSONAL business email is
// found that is actually published on the web. Hunter Domain Search returns each
// email with the pages it was found on; we keep only type "personal" emails that
// have at least one source page, never pattern-guessed addresses (Hunter Email
// Finder is not used). Generic inboxes (info@, sales@) do not qualify.
//
// Result statuses: FOUND, GENERIC_ONLY, NONE, NO_WEBSITE, ERROR.

export const MAX_PER_REQUEST = 10;
export const MIN_CONFIDENCE = 70;
const BLOCKED_DOMAINS = /(^|\.)(gmail|yahoo|hotmail|outlook|aol|icloud|facebook|linkedin|instagram|twitter|x|google|sites\.google|wixsite|godaddysites|yelp|bbb|sam|usaspending|mapquest|yellowpages)\.(com|org|gov|net)$/i;
const DECISION_TITLE = /\b(owner|co-?owner|president|ceo|chief executive|founder|principal|partner|general manager|managing|director|vice president|vp|operations|office manager|manager)\b/i;

// Website from SAM -> bare domain, or null if unusable for discovery.
export function domainOf(website) {
  if (!website) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    if (!host.includes('.') || BLOCKED_DOMAINS.test(host)) return null;
    return host;
  } catch { return null; }
}

// A source must be a page that publishes the email, not a search-results or login-walled link.
const NOT_EVIDENCE = /(^|\.)(google|bing|duckduckgo|yahoo|linkedin)\.[a-z.]+$/i;
const httpsSource = (uri) => { try { const u = new URL(uri); return /^https?:$/.test(u.protocol) && !NOT_EVIDENCE.test(u.hostname) ? u.href : null; } catch { return null; } };

// Picks the best published personal email from a Hunter domain-search response.
export function pickEmail(hunter, domain) {
  const emails = Array.isArray(hunter?.data?.emails) ? hunter.data.emails : [];
  const published = emails
    .map((e) => ({ ...e, sourceUris: (e.sources || []).map((s) => httpsSource(s.uri)).filter(Boolean) }))
    .filter((e) => typeof e.value === 'string' && e.value.toLowerCase().endsWith('@' + domain) && e.sourceUris.length > 0);
  const personal = published.filter((e) => e.type === 'personal' && (e.confidence ?? 0) >= MIN_CONFIDENCE && e.verification?.status !== 'invalid');
  const generic = published.filter((e) => e.type === 'generic');
  if (!personal.length) {
    return {
      status: generic.length ? 'GENERIC_ONLY' : 'NONE',
      detail: { domain, personal_seen: emails.filter((e) => e.type === 'personal').length, generic_published: generic.map((e) => e.value).slice(0, 5) },
    };
  }
  const rank = (e) => (e.confidence ?? 0) + (DECISION_TITLE.test(e.position || '') ? 25 : 0) + (e.first_name && e.last_name ? 5 : 0);
  const best = personal.slice().sort((a, b) => rank(b) - rank(a))[0];
  const evidence = best.sourceUris.find((u) => u.startsWith('https://')) || best.sourceUris[0];
  return {
    status: 'FOUND',
    email: best.value.toLowerCase(),
    contact_name: [best.first_name, best.last_name].filter(Boolean).join(' ') || null,
    contact_title: best.position || null,
    confidence: best.confidence ?? null,
    evidence_url: evidence,
    sources: best.sourceUris.slice(0, 5),
    detail: {
      domain,
      verification: best.verification?.status || null,
      alternatives: personal.filter((e) => e !== best).slice(0, 3).map((e) => ({ email: e.value, position: e.position || null, confidence: e.confidence ?? null })),
      generic_published: generic.map((e) => e.value).slice(0, 3),
    },
  };
}

// Row patch for sam_contractor_leads.
export function discoveryPatch(result, now = new Date()) {
  return {
    email_discovery_status: result.status,
    discovered_email: result.email || null,
    discovered_contact_name: result.contact_name || null,
    discovered_contact_title: result.contact_title || null,
    email_confidence: result.confidence ?? null,
    email_evidence_url: result.evidence_url || null,
    email_sources: result.sources || [],
    email_discovery_detail: result.detail || {},
    email_discovered_at: now.toISOString(),
  };
}

// Hunter errors that should stop the whole batch (bad key, no credits, rate limit).
export class StopBatch extends Error {}

export async function discoverOne(lead, { apiKey, request = (...a) => fetch(...a) }) {
  const domain = domainOf(lead?.match_evidence?.website);
  if (!domain) return { status: 'NO_WEBSITE', detail: { reason: 'No usable business website in SAM' } };
  const url = new URL('https://api.hunter.io/v2/domain-search');
  url.search = new URLSearchParams({ domain, type: 'personal', limit: '10', api_key: apiKey }).toString();
  let res;
  try { res = await request(url.href, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(12000) }); }
  catch { return { status: 'ERROR', detail: { domain, reason: 'Hunter did not respond' } }; }
  if (res.status === 401) throw new StopBatch('Hunter rejected the API key. Check HUNTER_API_KEY in Netlify.');
  if (res.status === 402 || res.status === 403) throw new StopBatch('Hunter has no searches left on this plan. Add credits or wait for the monthly reset.');
  if (res.status === 429) throw new StopBatch('Hunter rate limit reached. Wait a minute and run again.');
  if (!res.ok) return { status: 'ERROR', detail: { domain, reason: `Hunter returned HTTP ${res.status}` } };
  const body = await res.json().catch(() => null);
  if (!body) return { status: 'ERROR', detail: { domain, reason: 'Unreadable Hunter response' } };
  // type=personal filters the list; generic inboxes are re-checked from the same call when present.
  return pickEmail(body, domain);
}
