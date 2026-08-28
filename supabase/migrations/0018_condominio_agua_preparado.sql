-- =============================================================================
-- 0018_condominio_agua_preparado.sql
-- "Prédio preparado" x "não preparado" para individualização de ÁGUA (completa).
-- Só troca o parágrafo "Análise técnica:" da seção 1 do PDF.
--
--  condominios.agua_preparado  -> escolha por condomínio (default: não preparado)
--  templates_texto.sec_analise_agua_preparado / _nao_preparado
--                              -> os dois textos, editáveis em Textos-modelo
--  templates_texto.sec_individualizacao_agua
--                              -> passa a começar com o marcador {analise_tecnica}
--                                 (o PDF substitui pelo texto certo)
-- =============================================================================

alter table public.condominios
  add column if not exists agua_preparado boolean not null default false;

alter table public.templates_texto
  add column if not exists sec_analise_agua_preparado text,
  add column if not exists sec_analise_agua_nao_preparado text;

update public.templates_texto set
  sec_analise_agua_preparado =
    'Análise técnica: Prédio preparado para medição individualizada de consumo de água através de tubulações distribuídas em SHAFTS nos corredores.',
  sec_analise_agua_nao_preparado =
    'Análise técnica: Trata-se de um edifício com as tubulações em PVC distribuídas verticalmente por colunas, alimentado cozinha e banheiros com vasos sanitários de caixa acoplada.',
  sec_individualizacao_agua =
    regexp_replace(
      coalesce(sec_individualizacao_agua, ''),
      '^Análise técnica:[^\n]*\n*',
      '{analise_tecnica}' || E'\n\n'
    ),
  updated_at = now()
where is_padrao;
