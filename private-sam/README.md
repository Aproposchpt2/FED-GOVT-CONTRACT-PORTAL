# Private SAM.gov contractor search

Branch: feature/private-sam-contractor-search. Route: /sam-contractor-search.
Owner: jmitchell@aproposgroupllc.com. No public navigation entry.

Sign in through /onboarding.html on the same preview origin, return to the search workspace, and select Connect owner session. Existing verified client_sessions are checked server-side on every request, including expiry and revocation. The new secure HttpOnly SameSite cookie is distinct from existing SAM token sessions. An email supplied by a browser never grants access. Sign out clears the workspace cookie. Public HTML is a login shell; search and stored data require owner authorization.

Environment: SUPABASE_URL, SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY), SAM_GOV_API_KEY (or existing SAM_API_KEY). Existing portal OTP sign-in uses existing Resend configuration. Keys stay on the server. No public RLS grants or policies on sam_contractor_leads; only service_role may read/write through the owner-gated API.

Uses Opportunities v2 award notices, not a comprehensive registered-entity directory. Keyword maps to title; state is place of performance, not contractor address. Reads opportunitiesData; only notices containing award.awardee.name become leads. Government notice POCs are never saved as contractor contacts. Defaults to 90 days and award notices; validates one-year date maximum. Up to 20 pages of 50 notices per run, targeting 50/100/150 unique awardees. UEI deduplication with name/location fallback. Saved record stores latest encountered award evidence, not complete award history. Stop/exhaustion and partial failures are explicit. One request per page keeps calls bounded; upstream timeouts and DB errors return sanitized errors. Target is not a guarantee of available results.

Start new Task clears the view and counters without deleting persisted leads. JSON error report contains timestamp, failing stage and sanitized message. Search meter advances after completed pages; 100% means target reached or source exhausted. Scan-limit stop remains below 100%.

Validation: node --test tests/sam-search.test.mjs (5 passing); npm run build (static build). Database migration applied separately through connected Supabase tools. Live owner sign-in and authenticated upstream search require owner interaction; do not claim live acceptance until exercised.

Source: https://open.gsa.gov/api/get-opportunities-public-api/
