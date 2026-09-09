-- =============================================================================
-- SEED DE STAGING — dados 100% fictícios para revisão de design.
-- Rodar no SQL Editor do projeto Supabase de STAGING, DEPOIS das migrações
-- 0001..0031. NÃO rodar em produção.
--
-- Pré-requisito: criar 1 usuário em Authentication → Users (o trigger
-- on_auth_user_created cria a linha em public.usuarios). Sugerido:
--   email: design@exemplo.com   user metadata: {"perfil":"admin","nome":"Design"}
--
-- Para "resetar" o staging: rodar o bloco LIMPEZA e depois o seed de novo.
-- =============================================================================

-- ---------- LIMPEZA (opcional — descomente para recriar do zero) --------------
-- delete from public.tipo_apartamento_itens;
-- delete from public.tipos_apartamento;
-- delete from public.orcamento_valores_congelados;
-- delete from public.gerenciamento_mensal;
-- delete from public.orcamento_snapshots;
-- delete from public.historico_alteracoes where orcamento_id is not null;
-- delete from public.orcamentos;
-- delete from public.obra_materiais;
-- delete from public.obra_requisicoes;
-- delete from public.obra_deducoes;
-- delete from public.obra_apartamentos;
-- delete from public.obras;
-- delete from public.precos;
-- delete from public.condominios;

-- ---------- CONDOMÍNIOS ------------------------------------------------------
insert into public.condominios
  (nome, cnpj, endereco, cidade, uf, administradora, sindico_nome,
   contato_nome, contato_email, contato_telefone, qtd_unidades,
   agua_preparado, parcelamento_especial, parcelamento_especial_modo, observacoes)
values
  ('Ed. Aurora', '11.111.111/0001-11', 'Av. Exemplo, 100', 'Santos', 'SP',
   'Adm. Modelo', 'Síndico A', 'Contato A', 'contatoA@exemplo.com', '(13) 90000-0001',
   48, false, false, 'padrao', 'Condomínio de teste — não preparado, válvula hidra.'),
  ('Cond. Marine', '22.222.222/0001-22', 'Rua Demo, 200', 'São Vicente', 'SP',
   'Adm. Modelo', 'Síndico B', 'Contato B', 'contatoB@exemplo.com', '(13) 90000-0002',
   60, true, true, 'padrao', 'Condomínio de teste — preparado, parcelamento especial padrão.'),
  ('Res. Portal do Sol', '33.333.333/0001-33', 'Alameda Fictícia, 300', 'Praia Grande', 'SP',
   'Adm. Exemplo', 'Síndico C', 'Contato C', 'contatoC@exemplo.com', '(13) 90000-0003',
   32, false, true, 'medio', 'Condomínio de teste — caixa acoplada, parcelamento médio.'),
  ('Ed. Belvedere', '44.444.444/0001-44', 'Praça Teste, 400', 'Guarujá', 'SP',
   'Adm. Exemplo', 'Síndico D', 'Contato D', 'contatoD@exemplo.com', '(13) 90000-0004',
   120, true, true, 'longo', 'Condomínio de teste — preparado, parcelamento longo.')
on conflict do nothing;

-- ---------- TABELA DE PREÇOS ----------------------------------------------------
-- preço = base do item, com acréscimo por forma (à vista < 6x < 9x < 12x).
-- Vale para todas as formas "próprias" (sem usa_preco_de_forma_id).
with base(slug, valor) as (
  values
    ('caixa_acoplada', 950.00),
    ('hidra',          180.00),
    ('hidrometro_visual', 320.00),
    ('preparado_1_5m3', 890.00),
    ('preparado_2_5m3', 990.00),
    ('preparado_1_5m3_agua_quente', 1180.00),
    ('gas_1_6',        1450.00),
    ('gas_2_5',        1690.00),
    ('tss',            3150.00)
),
fator(num_parcelas, mult) as (
  values (1, 1.00), (6, 1.08), (9, 1.16), (12, 1.24)
)
insert into public.precos (item_id, forma_pagamento_id, valor, vigencia_inicio)
select i.id, f.id, round((b.valor * fa.mult)::numeric, 2), date '2025-01-01'
from base b
join public.itens_precificaveis i on i.slug = b.slug
join fator fa on true
join public.formas_pagamento f
  on f.num_parcelas = fa.num_parcelas and f.usa_preco_de_forma_id is null
where not exists (
  select 1 from public.precos p
  where p.item_id = i.id and p.forma_pagamento_id = f.id
);

-- ---------- ORÇAMENTO A — Individualização de água (completa) ----------------
with c as (select id from public.condominios where nome = 'Ed. Aurora' limit 1),
o as (
  insert into public.orcamentos
    (numero, ano, data_orcamento, condominio_id, status, tipo_proposta,
     cenario_agua, incluir_tss, qtd_tss, parcelas_custom, formas_pagamento_visiveis,
     tss_opcoes, prazo, observacoes)
  select 'DEMO-001', 2026, date '2026-09-01', c.id, 'rascunho', 'completa',
         'auto', true, 1, '{}', '{1,6,9,12}', '[]'::jsonb, '45 dias após aprovação',
         'Orçamento de exemplo — abra e clique em "Salvar" no montador para gerar os valores.'
  from c
  returning id
),
gm as (
  insert into public.gerenciamento_mensal (orcamento_id, valor_por_hidrometro)
  select id, 4.00 from o
  returning orcamento_id
),
t as (
  insert into public.tipos_apartamento (orcamento_id, nome, unidades, ordem)
  select id, 'Apartamento padrão', 48, 0 from o
  returning id
)
insert into public.tipo_apartamento_itens (tipo_apartamento_id, item_id, quantidade, ordem)
select t.id, i.id, q.quantidade, q.ordem
from t
join (values ('preparado_1_5m3', 2, 0), ('preparado_1_5m3_agua_quente', 1, 1)) as q(slug, quantidade, ordem) on true
join public.itens_precificaveis i on i.slug = q.slug;

-- ---------- ORÇAMENTO B — Individualização de gás ---------------------------
with c as (select id from public.condominios where nome = 'Cond. Marine' limit 1),
o as (
  insert into public.orcamentos
    (numero, ano, data_orcamento, condominio_id, status, tipo_proposta,
     incluir_tss, qtd_tss, medidor_gas, parcelas_custom, formas_pagamento_visiveis,
     tss_opcoes, prazo, observacoes)
  select 'DEMO-002', 2026, date '2026-09-02', c.id, 'rascunho',
         'individualizacao_gas', true, 4, 'gas_1_6', '{}', '{1,6,9,12}', '[]'::jsonb,
         '30 dias úteis', 'Orçamento de exemplo — abra e clique em "Salvar individualização de gás".'
  from c
  returning id
)
insert into public.gerenciamento_mensal
  (orcamento_id, valor_por_hidrometro, qtd_apartamentos, pontos_por_apartamento, qtd_hidrometros)
select id, 4.00, 60, 1, 60 from o;

-- ---------- ORÇAMENTO C — Gestão mensal de água (leitura visual) -----------
with c as (select id from public.condominios where nome = 'Res. Portal do Sol' limit 1),
o as (
  insert into public.orcamentos
    (numero, ano, data_orcamento, condominio_id, status, tipo_proposta,
     incluir_tss, qtd_tss, parcelas_custom, formas_pagamento_visiveis,
     tss_opcoes, observacoes)
  select 'DEMO-003', 2026, date '2026-09-03', c.id, 'enviado',
         'gestao_mensal_agua', false, 1, '{}', '{1,6,9,12}', '[]'::jsonb,
         'Orçamento de exemplo — gestão mensal.'
  from c
  returning id
)
insert into public.gerenciamento_mensal
  (orcamento_id, valor_por_hidrometro, qtd_apartamentos, pontos_por_apartamento)
select id, 7.50, 32, 1 from o;

-- ---------- OBRA de exemplo ------------------------------------------------
with c as (select id from public.condominios where nome = 'Ed. Belvedere' limit 1),
ob as (
  insert into public.obras (condominio_id, status, previsao_inicio, previsao_fim, outros_custos, observacoes)
  select id, 'em_andamento', date '2026-09-10', date '2026-11-30', 12000.00,
         'Obra de exemplo para revisão de design.'
  from c
  returning id
),
ap as (
  insert into public.obra_apartamentos (obra_id, identificacao, status, ordem)
  select ob.id, 'Apto ' || g, case when g <= 3 then 'concluido' else 'pendente' end, g - 1
  from ob, generate_series(1, 8) g
  returning obra_id
),
r as (
  insert into public.obra_requisicoes (obra_id, numero, data, valor_total)
  select id, 'REQ-001', date '2026-09-15', 4820.00 from ob
  returning id
)
insert into public.obra_materiais (requisicao_id, descricao, quantidade, unidade, valor_unitario, valor_total, ordem)
select r.id, m.descricao, m.q, m.un, m.vu, round((m.q * m.vu)::numeric, 2), m.ordem
from r
join (values
  ('Tubo PVC 3/4"', 40, 'm', 12.50, 0),
  ('Registro esfera 3/4"', 16, 'un', 28.90, 1),
  ('Massa/argamassa', 8, 'sc', 21.00, 2)
) as m(descricao, q, un, vu, ordem) on true;
