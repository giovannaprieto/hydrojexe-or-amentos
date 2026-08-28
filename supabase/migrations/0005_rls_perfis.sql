-- =============================================================================
-- Hydrojexe - Sistema de Orçamentos
-- Migration 0005 - Políticas RLS por perfil (substitui a política provisória)
-- =============================================================================
-- Perfis: 'comercial' e 'admin' (public.is_admin()).
--
-- Matriz:
--   usuarios ............................ SELECT: autenticado | WRITE: admin
--   formas_pagamento ................... SELECT: autenticado | WRITE: admin
--   itens_precificaveis ............... SELECT: autenticado | WRITE: admin
--   precos ............................. SELECT: autenticado | WRITE: admin
--   templates_texto ................... SELECT: autenticado | WRITE: admin
--   condominios ....................... ALL: autenticado
--   orcamentos ........................ ALL: autenticado
--   tipos_apartamento ................ ALL: autenticado
--   tipo_apartamento_itens .......... ALL: autenticado
--   orcamento_valores_congelados .... ALL: autenticado
--   gerenciamento_mensal ............ ALL: autenticado
--   historico_alteracoes ........... SELECT + INSERT: autenticado (append-only)
-- =============================================================================

-- 1) Remove as políticas provisórias "<tabela>_authenticated_all" -------------
do $$
declare
  t text;
  tabelas text[] := array[
    'usuarios','condominios','formas_pagamento','itens_precificaveis','precos',
    'orcamentos','tipos_apartamento','tipo_apartamento_itens',
    'orcamento_valores_congelados','historico_alteracoes','gerenciamento_mensal','templates_texto'
  ];
begin
  foreach t in array tabelas loop
    execute format('drop policy if exists %I on public.%I;', t || '_authenticated_all', t);
  end loop;
end;
$$;

-- 2) Catálogo global: leitura para autenticado, escrita só admin -------------
do $$
declare
  t text;
  tabelas text[] := array['usuarios','formas_pagamento','itens_precificaveis','precos','templates_texto'];
begin
  foreach t in array tabelas loop
    execute format('create policy %I on public.%I for select to authenticated using (true);',
                   t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_admin());',
                   t || '_admin_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin());',
                   t || '_admin_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_admin());',
                   t || '_admin_delete', t);
  end loop;
end;
$$;

-- 3) Condomínios + tabelas de orçamento: acesso total para autenticado ------
do $$
declare
  t text;
  tabelas text[] := array[
    'condominios','orcamentos','tipos_apartamento','tipo_apartamento_itens',
    'orcamento_valores_congelados','gerenciamento_mensal'
  ];
begin
  foreach t in array tabelas loop
    execute format('create policy %I on public.%I for all to authenticated using (true) with check (true);',
                   t || '_all', t);
  end loop;
end;
$$;

-- 4) Histórico de alterações: append-only (sem update/delete) ---------------
create policy historico_alteracoes_select on public.historico_alteracoes
  for select to authenticated using (true);
create policy historico_alteracoes_insert on public.historico_alteracoes
  for insert to authenticated with check (true);
