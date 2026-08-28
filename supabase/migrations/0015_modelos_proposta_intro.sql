-- =============================================================================
-- 0015_modelos_proposta_intro.sql
-- Texto de abertura editável (antes das seções). Hoje só a "individualização de
-- gás" usa — é a "Análise técnica: Trata-se de um edifício ..." que varia por
-- condomínio. Enquanto nulo, usa o padrão do código.
-- =============================================================================
alter table public.modelos_proposta
  add column if not exists intro text;
