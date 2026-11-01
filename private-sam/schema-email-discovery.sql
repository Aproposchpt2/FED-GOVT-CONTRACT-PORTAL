-- Email discovery for SAM contractor leads. A lead is an outreach candidate only after a
-- personal business email is found PUBLISHED on the web (Hunter Domain Search, type
-- "personal", with at least one source page). Never pattern-guessed addresses.
alter table public.sam_contractor_leads
 add column if not exists email_discovery_status text
   check (email_discovery_status in ('FOUND','GENERIC_ONLY','NONE','NO_WEBSITE','ERROR')),
 add column if not exists discovered_email text
   check (discovered_email is null or (discovered_email = lower(btrim(discovered_email)) and discovered_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
 add column if not exists discovered_contact_name text,
 add column if not exists discovered_contact_title text,
 add column if not exists email_confidence integer check (email_confidence is null or email_confidence between 0 and 100),
 add column if not exists email_evidence_url text check (email_evidence_url is null or email_evidence_url ~ '^https?://'),
 add column if not exists email_sources text[] not null default '{}',
 add column if not exists email_discovery_detail jsonb not null default '{}',
 add column if not exists email_discovered_at timestamptz,
 add constraint sam_contractor_leads_found_has_evidence
   check (email_discovery_status is distinct from 'FOUND' or (discovered_email is not null and email_evidence_url is not null));
create index if not exists sam_contractor_leads_email_status_idx on public.sam_contractor_leads(email_discovery_status);
