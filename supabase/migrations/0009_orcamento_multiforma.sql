-- =============================================================================
-- Hydrojexe - Sistema de Orçamentos
-- Migration 0009 - Orçamento sem "forma escolhida"; 24x opcional no PDF
-- =============================================================================
-- O orçamento não elege mais uma forma de pagamento. Ao salvar, os preços das
-- 4 formas próprias (à vista, 6x, 9x, 12x) são congelados. O PDF mostra as 4;
-- o 24x só entra se incluir_24x = true (reaproveita os preços de 12x).
-- Snapshots (valor_total, valor_tss, valor_por_apartamento) passam a ser os
-- valores À VISTA, por convenção.
-- =============================================================================

alter table public.orcamentos drop column if exists forma_pagamento_id;

alter table public.orcamentos
  add column if not exists incluir_24x boolean not null default false;
