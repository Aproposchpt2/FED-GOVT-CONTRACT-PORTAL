# Private SAM.gov contractor search

Branch: feature/private-sam-contractor-search. Route: /sam-contractor-search.
Owner: jmitchell@aproposgroupllc.com. No public navigation entry.

Sign in through /onboarding.html on the same preview origin, return to the search workspace, and select Connect owner session. Existing verified client_sessions are checked server-side on every request, including expiry and revocation. The new secure HttpOnly SameSite cookie is distinct from existing SAM token sessions. An email supplied by a browser never grants access. Sign out clears the workspace cookie. Public HTML is a login shell; search and stored data require owner authorization.

Environment: SUPABASE_URL, SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY), SAM_GOV_API_KEY (or existing SAM_API_KEY). Existing portal OTP sign-in uses existing Resend configuration. Keys stay on the server. No public RLS grants or policies on sam_contractor_leads; only service_role may read/write through the owner-gated API.

Uses SAM.gov Entity Management v4 active registered contractor profiles. Loads the same owner profile NAICS codes used by the contract dashboard from capgen_subscriptions, with Select All / Clear All / Add NAICS ribbon controls. Search uses any selected NAICS, querying one code per page and deduplicating across codes by UEI. Returns registered NAICS and descriptions as capability evidence and highlights intersections with the selected scope. Optional capability keyword matches registered NAICS descriptions; this is classification evidence, not semantic capability-statement analysis or proof of past performance. State filters the contractor location; optional PSC filters registered product/service codes. Removes opportunity dates, notice types, solicitation numbers and award set-asides from this workflow. API key remains backend-only. Ten entities per API request, up to 100 requests / 1,000 reviewed profiles, with 2.2-second spacing to stay within request rate limits. Entity API access depends on the configured key entitlement. No fallback to opportunity notices.

Start new Task clears the view and counters without deleting persisted leads. JSON error report contains timestamp, failing stage and sanitized message. Search meter advances after completed pages; 100% means target reached or source exhausted. Scan-limit stop remains below 100%.

Validation: node --test tests/sam-search.test.mjs (7 passing); npm run build (static build). Database migration applied separately through connected Supabase tools. Live owner sign-in and authenticated upstream search require owner interaction; do not claim live acceptance until exercised.

Source: https://open.gsa.gov/api/entity-api/

## Broad contractor scope (uploaded package adaptation)
The default scope preset now comes from STELLAR_SAM_GOV_Broad_Scope_Search_Ruflo_Execution_v1.0_DOWNLOAD.json: NAICS 541512/541519/561422, PSC DE01, seven capability groups, included/excluded phrases. Select the owner-profile preset to restore the existing contract-dashboard NAICS scope. These searches are separate fan-outs combined with OR; a PSC-only contractor is retained without a NAICS match. Each entity must be active, registered, and match the query's registered code. State remains a contractor-location filter. Optional description keyword is a hard description filter; phrase lists are relevance signals.

Contractor scoring adapts only weights supported by entity evidence: +18 for any registered NAICS match, +24 for any registered PSC match, +10 per included phrase found in registered descriptions, −50 per excluded phrase. No opportunity-title, notice type, RFI, deadline or set-aside bonuses are transferred. Groups are reported only when corresponding phrases appear in returned registered descriptions. A full capability statement and past performance remain unverified. Default minimum score 0 retains classification-only candidates with an UNVERIFIED capability status; 20 is the uploaded profile's suggested review threshold. This threshold can be changed. Every saved lead includes score reasons and a snapshot of the scope used. Existing lead records are updated by UEI; this table is not a search-run history ledger.

Live acceptance requires the owner's verified sign-in and the configured SAM API key's Entity API permissions. No fabricated session or capability evidence is used for acceptance.

## Owner access repair
The owner's existing capgen_subscriptions record is active but has an expired agency_30 term. In this isolated branch, pipeline-otp-send explicitly permits OTP delivery to jmitchell@aproposgroupllc.com independently of customer-plan expiry. This does not issue a session or bypass mailbox verification. Other customer access rules remain unchanged. The sign-in link carries a whitelisted next=/sam-contractor-search return path. No subscription rows or expiration timestamps were changed.
Validation: 16 tests pass, including expired-owner-plan OTP eligibility, rejection of other expired customers, and OTP storage error handling. Email delivery tests are mocked; the user requests and enters their actual code.

## Results columns
Contractor Name | UEI | CAGE Code | City | State | Primary NAICS Code | PSC Codes | Capability Match | Match Score | Registration Status | SAM.gov Profile.

The primary NAICS display is sourced only from assertions.goodsAndServices.primaryNaics and saved as primary_naics. Missing primary codes display Not supplied, including older saved records until they are rediscovered. The matching query code and secondary NAICS codes are never substituted for the registered primary. Full registered codes remain available internally for discovery and relevance calculations, but are not listed in the results columns. PSC codes use the stored entity evidence; capability matches retain unverified labeling. The SAM.gov Profile action opens entity search and identifies the UEI to search for; it does not invent an unsupported deep link.
Validation: 18 tests pass, including secondary-code discovery with a different registered primary, and missing-primary handling.
