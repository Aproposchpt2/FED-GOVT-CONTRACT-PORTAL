alter table public.sam_contractor_leads
 add column scope_profile_id text,
 add column fit_score integer not null default 0,
 add column match_evidence jsonb not null default '{}',
 add column matched_capabilities text[] not null default '{}',
 add column capability_status text not null default 'UNVERIFIED';
create index sam_contractor_leads_score_idx on public.sam_contractor_leads(fit_score desc);
