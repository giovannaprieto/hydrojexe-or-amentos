-- =============================================================================
-- Hydrojexe - Seed da tabela de preços vigente
-- =============================================================================
-- Valores transcritos de "tabela - orçamento.jpeg".
-- Vigência: a partir de 2026-08-27, sem fim (tabela atual).
-- Formas: a_vista, 6x, 9x, 12x  (24x reaproveita 12x via formas_pagamento).
-- Hidrômetro Visual não tem 12x na planilha -> só 3 linhas.
--
-- Rode DEPOIS de seed.sql. Idempotente: só insere se não houver preço
-- com vigência sobreposta para o mesmo (item, forma).
-- =============================================================================

with tabela (item_slug, forma_slug, valor) as (
  values
    ('preparado_1_5m3',             'a_vista',  628.74),
    ('preparado_1_5m3',             '6x',       643.86),
    ('preparado_1_5m3',             '9x',       706.86),
    ('preparado_1_5m3',             '12x',      812.70),

    ('preparado_2_5m3',             'a_vista',  721.98),
    ('preparado_2_5m3',             '6x',       739.62),
    ('preparado_2_5m3',             '9x',       748.44),
    ('preparado_2_5m3',             '12x',      860.58),

    ('hidrometro_visual',           'a_vista',  304.50),
    ('hidrometro_visual',           '6x',       322.77),
    ('hidrometro_visual',           '9x',       342.13),

    ('tss',                         'a_vista', 3150.00),
    ('tss',                         '6x',      3402.00),
    ('tss',                         '9x',      3654.00),
    ('tss',                         '12x',     3906.00),

    ('preparado_1_5m3_agua_quente', 'a_vista', 1064.70),
    ('preparado_1_5m3_agua_quente', '6x',      1222.20),
    ('preparado_1_5m3_agua_quente', '9x',      1320.48),
    ('preparado_1_5m3_agua_quente', '12x',     1509.48),

    ('caixa_acoplada',              'a_vista', 1025.64),
    ('caixa_acoplada',              '6x',      1113.84),
    ('caixa_acoplada',              '9x',      1296.54),
    ('caixa_acoplada',              '12x',     1338.12),

    ('hidra',                       'a_vista', 1319.22),
    ('hidra',                       '6x',      1396.08),
    ('hidra',                       '9x',      1663.20),
    ('hidra',                       '12x',     1829.52),

    ('gas_1_6',                     'a_vista', 1179.36),
    ('gas_1_6',                     '6x',      1251.18),
    ('gas_1_6',                     '9x',      1338.12),
    ('gas_1_6',                     '12x',     1471.68),

    ('gas_2_5',                     'a_vista', 1227.24),
    ('gas_2_5',                     '6x',      1341.90),
    ('gas_2_5',                     '9x',      1435.14),
    ('gas_2_5',                     '12x',     1556.10)
),
resolvido as (
  select i.id as item_id, f.id as forma_pagamento_id, t.valor
  from tabela t
  join public.itens_precificaveis i on i.slug = t.item_slug
  join public.formas_pagamento f on f.slug = t.forma_slug
)
insert into public.precos (item_id, forma_pagamento_id, valor, vigencia_inicio, vigencia_fim)
select r.item_id, r.forma_pagamento_id, r.valor, date '2026-08-27', null
from resolvido r
where not exists (
  select 1 from public.precos p
  where p.item_id = r.item_id
    and p.forma_pagamento_id = r.forma_pagamento_id
    and daterange(p.vigencia_inicio, p.vigencia_fim, '[)')
        && daterange(date '2026-08-27', null, '[)')
);
