# Private SAM.gov contractor search

Branch: feature/private-sam-contractor-search. Route: /sam-contractor-search.
Owner: jmitchell@aproposgroupllc.com. No public navigation entry.

Sign in through /onboarding.html on the same preview origin, return to the search workspace, and select Connect owner session. Existing verified client_sessions are checked server-side on every request, including expiry and revocation. The new secure HttpOnly SameSite cookie is distinct from existing SAM token sessions. An email supplied by a browser never grants access. Sign out clears the workspace cookie. Public HTML is a login shell; search and stored data require owner authorization.

Environment: SUPABASE_URL, SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY), SAM_GOV_API_KEY (or existing SAM_API_KEY). Existing portal OTP sign-in uses existing Resend configuration. Keys stay on the server. No public RLS grants or policies on sam_contractor_leads; only service_role may read/write through the owner-gated API.

Uses SAM.gov Entity Management v4 active registered contractor profiles. Loads the same owner profile NAICS codes used by the contract dashboard from capgen_subscriptions, with Select All / Clear All / Add NAICS ribbon controls. Search uses any selected NAICS, querying one code per page and deduplicating across codes by UEI. Returns registered NAICS and descriptions as capability evidence and highlights intersections with the selected scope. Optional capability keyword matches registered NAICS descriptions; this is classification evidence, not semantic capability-statement analysis or proof of past performance. State filters the contractor location; optional PSC filters registered product/service codes. Removes opportunity dates, notice types, solicitation numbers and award set-asides from this workflow. API key remains backend-only. Ten entities per API request, up to 100 requests / 1,000 reviewed profiles, with 2.2-second spacing to stay within request rate limits. Entity API access depends on the configured key entitlement. No fallback to opportunity notices.

Start new Task clears the view and counters without deleting persisted leads. JSON error report contains timestamp, failing stage and sanitized message. Search meter advances after completed pages; 100% means target reached or source exhausted. Scan-limit stop remains below 100%.

Validation: node --test tests/sam-search.test.mjs (7 passing); npm run build (static build). Database migration applied separately through connected Supabase tools. Live owner sign-in and authenticated upstream search require owner interaction; do not claim live acceptance until exercised.

Source: https://open.gsa.gov/api/entity-api/
