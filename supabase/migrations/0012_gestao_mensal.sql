-- =============================================================================
-- 0012_gestao_mensal.sql
-- Etapa 8b-2 — propostas de "gestão mensal" (água / gás), leitura visual.
-- Fluxo enxuto: sem tipos de apartamento, sem parcelamento.
--   valor_por_hidrometro  -> valor mensal por apartamento (R$/mês)
--   qtd_hidrometros       -> total de pontos lidos (snapshot)
--   valor_total_mensal    -> total mensal (snapshot)
-- Faltavam só os dados usados no texto do PDF:
-- =============================================================================
alter table public.gerenciamento_mensal
  add column if not exists qtd_apartamentos integer
    check (qtd_apartamentos is null or qtd_apartamentos > 0);

alter table public.gerenciamento_mensal
  add column if not exists pontos_por_apartamento integer not null default 1
    check (pontos_por_apartamento > 0);
