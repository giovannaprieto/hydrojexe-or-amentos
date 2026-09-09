-- =============================================================================
-- 0031 — Terceiro modo de parcelamento especial: "medio".
--   medio : 12x usa o preço de 9x, 18x usa o de 12x
--           (à vista, 6x e 9x não mudam)
-- =============================================================================

alter table public.condominios
  drop constraint if exists condominios_parcelamento_especial_modo_check;
alter table public.condominios
  add constraint condominios_parcelamento_especial_modo_check
  check (parcelamento_especial_modo in ('padrao', 'medio', 'longo'));

insert into public.schema_migrations (version, descricao)
  values ('0031', 'parcelamento especial modo medio')
  on conflict (version) do nothing;
