-- =============================================================================
-- 0029 — Segundo modo de parcelamento especial ("longo").
--
--   padrao  : 9x usa o preço de 6x,  12x usa o de 9x   (24x já usa o de 12x)
--   longo   : 12x usa o preço de 6x, 24x usa o de 9x,   36x usa o de 12x
--
-- Em ambos, à vista e 6x não mudam. O modo só vale quando o condomínio tem
-- parcelamento especial ligado (coluna parcelamento_especial).
-- =============================================================================

alter table public.condominios
  add column if not exists parcelamento_especial_modo text not null default 'padrao';

alter table public.condominios
  drop constraint if exists condominios_parcelamento_especial_modo_check;
alter table public.condominios
  add constraint condominios_parcelamento_especial_modo_check
  check (parcelamento_especial_modo in ('padrao', 'longo'));

insert into public.schema_migrations (version, descricao)
  values ('0029', 'parcelamento especial modo longo')
  on conflict (version) do nothing;
