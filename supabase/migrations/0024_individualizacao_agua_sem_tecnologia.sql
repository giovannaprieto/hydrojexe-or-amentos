-- =============================================================================
-- 0024_individualizacao_agua_sem_tecnologia.sql
-- 6º tipo de proposta: "individualizacao_agua_sem_tecnologia" — instalação de
-- hidrômetros VISUAIS (sem telemetria). Mesmo fluxo do individualizacao_gas:
--   gerenciamento_mensal.qtd_apartamentos / pontos_por_apartamento /
--     valor_por_hidrometro (= gestão mensal por apartamento)
--   orcamentos.tss_opcoes  (array [{valor, parcelas}])
-- Só estende os CHECKs de tipo — nenhuma coluna nova.
-- =============================================================================
alter table public.orcamentos
  drop constraint if exists orcamentos_tipo_proposta_check;
alter table public.orcamentos
  add constraint orcamentos_tipo_proposta_check
  check (tipo_proposta in (
    'completa',
    'individualizacao_agua_sem_tecnologia',
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
    'individualizacao_agua_sem_tecnologia',
    'gestao_mensal_agua',
    'gestao_mensal_gas',
    'tss_light',
    'individualizacao_gas'
  ));
