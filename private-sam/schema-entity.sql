alter table public.sam_contractor_leads
 alter column source_notice_id drop not null,
 add column source_type text not null default 'sam_award_notice',
 add column registered_naics_codes text[] not null default '{}',
 add column matching_naics_codes text[] not null default '{}',
 add column capability_profile jsonb not null default '[]',
 add column registration_status text,
 add column cage text;
