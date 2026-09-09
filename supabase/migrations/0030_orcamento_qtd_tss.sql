-- =============================================================================
-- 0030 — Quantidade de TSS por orçamento.
-- Prédios grandes podem precisar de mais de um concentrador TSS. O rateio por
-- apartamento passa a ser (preço do TSS × qtd_tss) ÷ nº de apartamentos.
-- Vale para individualização de água (completa) e individualização de gás,
-- e só tem efeito quando "Incluir TSS" está marcado.
-- =============================================================================

alter table public.orcamentos
  add column if not exists qtd_tss integer not null default 1;

alter table public.orcamentos
  drop constraint if exists orcamentos_qtd_tss_check;
alter table public.orcamentos
  add constraint orcamentos_qtd_tss_check check (qtd_tss >= 1 and qtd_tss <= 20);

insert into public.schema_migrations (version, descricao)
  values ('0030', 'orcamento qtd_tss')
  on conflict (version) do nothing;
