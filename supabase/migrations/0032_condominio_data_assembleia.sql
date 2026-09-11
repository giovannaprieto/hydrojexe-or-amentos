-- =============================================================================
-- 0032 — Data da próxima assembleia do condomínio.
--   Usada para reabrir contato (follow-up) antes da assembleia quando o
--   condomínio ainda não tem orçamento aprovado — ver "Precisa de ação" no
--   dashboard.
-- =============================================================================

alter table public.condominios
  add column if not exists data_assembleia date;

insert into public.schema_migrations (version, descricao)
  values ('0032', 'condominios.data_assembleia')
  on conflict (version) do nothing;
