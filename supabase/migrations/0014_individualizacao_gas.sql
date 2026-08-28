-- =============================================================================
-- 0014_individualizacao_gas.sql
-- 5º tipo de proposta: "individualizacao_gas" — instalação de gasômetros por
-- telemetria (pontos por apartamento + até 4 opções de investimento, sem
-- entrada + linha de gerenciamento mensal em vermelho).
-- Reaproveita colunas já existentes:
--   gerenciamento_mensal.qtd_apartamentos / pontos_por_apartamento / valor_por_hidrometro
--   orcamentos.tss_opcoes  (array [{valor, parcelas}] — mesmo formato do TSS Light)
-- Só estende os CHECKs de tipo.
-- =============================================================================
alter table public.orcamentos
  drop constraint if exists orcamentos_tipo_proposta_check;
alter table public.orcamentos
  add constraint orcamentos_tipo_proposta_check
  check (tipo_proposta in (
    'completa',
    'gestao_mensal_agua',
    'gestao_mensal_gas',
    'tss_light',
    'individualizacao_gas'
  ));

alter table public.modelos_proposta
  drop constraint if exists modelos_proposta_tipo_check;
alter table public.modelos_proposta
  add constraint modelos_proposta_tipo_check
  check (tipo in (
    'gestao_mensal_agua',
    'gestao_mensal_gas',
    'tss_light',
    'individualizacao_gas'
  ));
