alter table public.sam_contractor_leads add column primary_naics text;
comment on column public.sam_contractor_leads.primary_naics is 'Registered primary NAICS from SAM assertions.goodsAndServices.primaryNaics. Never inferred from the query or secondary codes.';
