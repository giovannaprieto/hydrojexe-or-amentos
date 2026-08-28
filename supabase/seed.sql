-- =============================================================================
-- Hydrojexe - Sistema de Orçamentos
-- Seed - dados de referência (catálogo único e formas de pagamento)
-- =============================================================================
-- Rode DEPOIS de 0001_schema.sql. Não insere preços (valores) nem orçamentos.
-- Idempotente: usa ON CONFLICT (slug).
-- =============================================================================

-- Formas de pagamento --------------------------------------------------------
-- 24x reaproveita os preços de 12x (usa_preco_de_forma_id).
insert into public.formas_pagamento (nome, slug, num_parcelas, ordem) values
  ('À vista', 'a_vista', 1,  0),
  ('6x',      '6x',      6,  1),
  ('9x',      '9x',      9,  2),
  ('12x',     '12x',     12, 3),
  ('24x',     '24x',     24, 4)
on conflict (slug) do nothing;

update public.formas_pagamento f
   set usa_preco_de_forma_id = (select id from public.formas_pagamento where slug = '12x')
 where f.slug = '24x'
   and f.usa_preco_de_forma_id is null;

-- Itens precificáveis (catálogo ÚNICO) -------------------------------------------------
insert into public.itens_precificaveis (nome, slug, unidade, is_tss, ordem, descricao) values
  ('Caixa acoplada',              'caixa_acoplada',              'ponto',     false, 0, 'Ponto / hidrômetro padrão'),
  ('Hidra',                       'hidra',                      'valvula',   false, 1, 'Troca de válvula hidra por caixa acoplada branca (não é hidrômetro)'),
  ('Hidrômetro Visual',           'hidrometro_visual',          'ponto',     false, 2, null),
  ('Preparado 1,5m³',             'preparado_1_5m3',            'ponto',     false, 3, null),
  ('Preparado 2,5m³',             'preparado_2_5m3',            'ponto',     false, 4, null),
  ('Preparado 1,5m³ Água quente', 'preparado_1_5m3_agua_quente','ponto',     false, 5, null),
  ('Gás 1.6',                     'gas_1_6',                    'ponto',     false, 6, null),
  ('Gás 2.5',                     'gas_2_5',                    'ponto',     false, 7, null),
  ('TSS',                         'tss',                        'orcamento', true,  8, 'Cobrado uma vez por orçamento; rateado pelo total de unidades do condomínio')
on conflict (slug) do nothing;

-- Template de texto padrão (vazio - preencher pela tela de modelo depois) --------------
insert into public.templates_texto (nome, is_padrao) values ('Padrão', true)
on conflict do nothing;
