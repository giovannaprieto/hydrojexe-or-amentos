-- =============================================================================
-- Hydrojexe - Sistema de Orçamentos
-- Migration 0008 - TSS opcional por orçamento
-- =============================================================================
-- Nem todo condomínio contrata o TSS. Quando incluir_tss = false, não há
-- rateio de TSS: o valor por apartamento é apenas a soma dos itens.
-- default true para manter o comportamento atual (e o caso mais comum).
-- =============================================================================

alter table public.orcamentos
  add column if not exists incluir_tss boolean not null default true;
