-- =============================================================================
-- 0013_tss_light.sql
-- Etapa 8b-3 — proposta "TSS Light".
-- Fluxo enxuto: qtd de equipamentos (usa orcamentos.qtd_equipamentos, de 0011)
-- + até 4 opções de investimento. Cada opção: valor por unidade + nº de
-- parcelas (0/1 = à vista; N = "Em 0Nx de R$ valor/N", SEM entrada).
-- =============================================================================
alter table public.orcamentos
  add column if not exists tss_opcoes jsonb not null default '[]';
  -- formato: [{ "valor": 3000, "parcelas": 1 }, { "valor": 3240, "parcelas": 6 }, ...]
