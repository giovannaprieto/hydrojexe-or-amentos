-- =============================================================================
-- Hydrojexe - Sistema de Orçamentos
-- Migration 0010 - Formas de pagamento extras por orçamento + administradora
-- =============================================================================
-- parcelas_custom: lista de nº de parcelas extras (ex.: {18,24,36}). Cada uma
-- vira uma opção a mais no PDF, com base nos preços de 12x, entrada 10% +
-- N parcelas iguais. Substitui o antigo incluir_24x (basta adicionar 24).
-- =============================================================================

alter table public.orcamentos drop column if exists incluir_24x;

alter table public.orcamentos
  add column if not exists parcelas_custom integer[] not null default '{}';

alter table public.condominios
  add column if not exists administradora text;
