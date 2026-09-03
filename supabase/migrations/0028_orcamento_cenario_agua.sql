-- =============================================================================
-- 0028 — Cenário da análise técnica (água) por orçamento.
-- "auto"           = comportamento atual (usa condominios.agua_preparado)
-- "caixa_acoplada" = edifício com vasos de caixa acoplada, sem válvula hidra:
--                    Seção 1 usa sec_analise_agua_caixa_acoplada; a Seção 4
--                    (INTERVENÇÃO) + fotos são as mesmas do "não preparado".
-- =============================================================================

alter table public.orcamentos
  add column if not exists cenario_agua text not null default 'auto';

alter table public.orcamentos
  drop constraint if exists orcamentos_cenario_agua_check;
alter table public.orcamentos
  add constraint orcamentos_cenario_agua_check
  check (cenario_agua in ('auto', 'caixa_acoplada'));

alter table public.templates_texto
  add column if not exists sec_analise_agua_caixa_acoplada text;

update public.templates_texto
  set sec_analise_agua_caixa_acoplada =
    'Análise técnica: Trata-se de um edifício com as tubulações em PVC distribuídas verticalmente por colunas, alimentado cozinha e banheiros com vasos sanitários de caixa acoplada.'
  where is_padrao = true
    and (sec_analise_agua_caixa_acoplada is null
         or btrim(sec_analise_agua_caixa_acoplada) = '');

insert into public.schema_migrations (version, descricao)
  values ('0028', 'orcamento cenario agua caixa acoplada')
  on conflict (version) do nothing;
