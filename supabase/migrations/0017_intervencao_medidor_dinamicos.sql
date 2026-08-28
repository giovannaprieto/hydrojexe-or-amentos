-- =============================================================================
-- 0017_intervencao_medidor_dinamicos.sql
-- Textos técnicos que variam conforme o item selecionado no orçamento:
--
--  a) Individualização completa — seção INTERVENÇÃO
--     Marcador {hidrometros} -> "<qtd> hidrômetros de <bitola>", onde
--     <qtd> é o total de pontos do orçamento e <bitola> vem do item
--     preparado (2,5m³ => 1/2" ; 1,5m³ => 3/4").
--
--  b) Individualização de gás — PROCEDIMENTO EXECUTIVO
--     Novo campo orcamentos.medidor_gas ('gas_1_6' | 'gas_2_5') define a
--     vazão no texto ("G 1.6 m³/h" ou "G 2.6 m³/h").
-- =============================================================================

update public.templates_texto set
  sec_intervencao =
    'a) Instalação de {hidrometros} equipados com sensor de telemetria. O Hidrômetro será provido de selo de inspeção do Inmetro e obedecerá às regulamentações da ABNT. O sensor será provido de selo de aprovação da Anatel.',
  updated_at = now()
where is_padrao;

alter table public.orcamentos
  add column if not exists medidor_gas text
    check (medidor_gas is null or medidor_gas in ('gas_1_6', 'gas_2_5'));
