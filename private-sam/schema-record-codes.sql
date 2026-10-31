alter table public.sam_contractor_leads
 add column psc_codes text[] not null default '{}',
 add column secondary_naics_codes text[] not null default '{}';
update public.sam_contractor_leads
 set psc_codes = array(select distinct value from jsonb_array_elements_text(case when jsonb_typeof(match_evidence->'registeredPsc')='array' then match_evidence->'registeredPsc' else '[]'::jsonb end) as codes(value) where value ~ '^[A-Z0-9]{4}$' order by value),
 secondary_naics_codes = case when primary_naics is not null then array(select distinct code from unnest(registered_naics_codes) as codes(code) where code<>primary_naics and code ~ '^[0-9]{6}$' order by code) else '{}'::text[] end;
comment on column public.sam_contractor_leads.psc_codes is 'All valid registered PSC codes returned by SAM Entity API.';
comment on column public.sam_contractor_leads.secondary_naics_codes is 'Registered NAICS excluding the registered primary. Empty when the primary is unknown; registered_naics_codes retains the unsplit list.';
