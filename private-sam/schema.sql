create table public.sam_contractor_leads (
 contractor_key text primary key,
 legal_name text not null,
 uei text,
 city text,
 state text,
 naics text,
 source_notice_id text not null,
 opportunity_title text,
 award_number text,
 award_amount numeric,
 source_url text not null,
 discovered_at timestamptz not null default now()
);
alter table public.sam_contractor_leads enable row level security;
revoke all on public.sam_contractor_leads from anon, authenticated;
grant select,insert,update on public.sam_contractor_leads to service_role;
create index sam_contractor_leads_discovered_idx on public.sam_contractor_leads(discovered_at desc);
