-- =============================================================================
-- Hydrojexe - Sistema de Orçamentos
-- Migration 0002 - Row Level Security (RLS)
-- =============================================================================
-- IMPORTANTE: no Supabase, toda tabela em `public` fica exposta via API (PostgREST)
-- usando a anon key. Habilitamos RLS em TODAS as tabelas já nesta fase para que
-- nada fique acessível sem usuário autenticado.
--
-- Política desta fase (scaffold): usuário AUTENTICADO tem acesso total.
-- O detalhamento por perfil (comercial x admin) entra junto com a etapa de login.
-- Helper public.is_admin() já fica pronto para essas políticas futuras.
-- =============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios u
    where u.id = auth.uid() and u.perfil = 'admin' and u.ativo
  );
$$;

do $$
declare
  t text;
  tabelas text[] := array[
    'usuarios',
    'condominios',
    'formas_pagamento',
    'itens_precificaveis',
    'precos',
    'orcamentos',
    'tipos_apartamento',
    'tipo_apartamento_itens',
    'orcamento_valores_congelados',
    'historico_alteracoes',
    'gerenciamento_mensal',
    'templates_texto'
  ];
begin
  foreach t in array tabelas loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);

    -- Fase scaffold: qualquer usuário autenticado pode ler e escrever.
    execute format($f$
      create policy %I on public.%I
        for all
        to authenticated
        using (true)
        with check (true);
    $f$, t || '_authenticated_all', t);
  end loop;
end;
$$;
