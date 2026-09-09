-- ==========================================================================
-- SCHEMA + CATÁLOGO COMPLETO (migrações 0001..0031 + seed.sql).
-- Cole TUDO de uma vez no SQL Editor de um projeto Supabase NOVO (staging).
-- Depois rode supabase/seed-staging.sql para os dados ficticios.
-- ==========================================================================

-- >>>>>>>>>>>>>>>>>>>>  0001_schema.sql  <<<<<<<<<<<<<<<<<<<<
-- =============================================================================
-- Hydrojexe - Sistema de Orçamentos
-- Migration 0001 - Esquema base (12 entidades)
-- =============================================================================
-- Regras de negócio de referência: prompt-sistema-hydrojexe_3.md
--
-- Convenções:
--   * Todas as tabelas usam uuid (gen_random_uuid()) como PK.
--   * Valores monetários: numeric(14,2) para totais, numeric(12,2) para unitários.
--   * created_at / updated_at em todas as tabelas de cadastro (trigger set_updated_at).
--   * "Congelamento" de preços: orçamentos NÃO são recalculados quando a tabela
--     de preços global muda (ver orcamento_valores_congelados).
-- =============================================================================

-- Extensões -------------------------------------------------------------------
create extension if not exists pgcrypto;      -- gen_random_uuid()
create extension if not exists btree_gist;    -- EXCLUDE com uuid + daterange em precos

-- Helper: trigger genérico de updated_at ------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- 1. usuarios
--    Espelha auth.users (Supabase Auth). Apenas 2 perfis: comercial | admin.
--    "Gerência" == admin (não é perfil separado).
-- =============================================================================
create table public.usuarios (
  id          uuid primary key references auth.users (id) on delete cascade,
  nome        text not null,
  email       text not null unique,
  perfil      text not null default 'comercial' check (perfil in ('comercial', 'admin')),
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_usuarios_updated_at
  before update on public.usuarios
  for each row execute function public.set_updated_at();

comment on table public.usuarios is 'Usuários internos. Máx. ~4. Perfis: comercial (funcionário) e admin (gerência).';

-- =============================================================================
-- 2. condominios
--    Dados de identificação do cliente. O "total de unidades" usado no rateio
--    de TSS é derivado da soma de tipos_apartamento.unidades do orçamento
--    (snapshot gravado em orcamentos.total_unidades), não daqui.
-- =============================================================================
create table public.condominios (
  id                 uuid primary key default gen_random_uuid(),
  nome               text not null,
  cnpj               text,
  endereco           text,
  cidade             text,
  uf                 char(2),
  sindico_nome       text,
  contato_nome       text,
  contato_email      text,
  contato_telefone   text,
  observacoes        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger trg_condominios_updated_at
  before update on public.condominios
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 3. formas_pagamento
--    Configuráveis (não fixas em 4). Ex.: À vista, 6x, 9x, 12x, 24x.
--    Regra "24x usa o mesmo valor-base que 12x": configurada via
--    usa_preco_de_forma_id (24x -> 12x). NÃO é hard-coded; ao resolver o preço
--    de uma forma com usa_preco_de_forma_id preenchido, consulta-se precos da
--    forma referenciada.
-- =============================================================================
create table public.formas_pagamento (
  id                    uuid primary key default gen_random_uuid(),
  nome                  text not null,                       -- rótulo exibido: "À vista", "12x"
  slug                  text not null unique,                -- "a_vista", "6x", "12x", "24x"
  num_parcelas          integer not null default 1 check (num_parcelas >= 1),
  usa_preco_de_forma_id uuid references public.formas_pagamento (id),
  ordem                 integer not null default 0,
  ativo                 boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint formas_pagamento_nao_referencia_si check (usa_preco_de_forma_id is null or usa_preco_de_forma_id <> id)
);
create trigger trg_formas_pagamento_updated_at
  before update on public.formas_pagamento
  for each row execute function public.set_updated_at();

comment on column public.formas_pagamento.usa_preco_de_forma_id is
  'Se preenchido, esta forma reaproveita os preços da forma referenciada (ex.: 24x -> 12x).';

-- =============================================================================
-- 4. itens_precificaveis
--    Catálogo ÚNICO para todos os condomínios:
--    Caixa acoplada, Hidra (troca de válvula hidra), Hidrômetro Visual,
--    Preparado 1,5m³, Preparado 2,5m³, Preparado 1,5m³ Água quente,
--    Gás 1.6, Gás 2.5, TSS.
--    TSS tem comportamento especial (rateio) -> flag is_tss.
-- =============================================================================
create table public.itens_precificaveis (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  slug        text not null unique,
  descricao   text,
  unidade     text not null default 'ponto',    -- 'ponto', 'valvula', 'orcamento'
  is_tss      boolean not null default false,   -- true apenas para o item TSS
  ativo       boolean not null default true,
  ordem       integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_itens_precificaveis_updated_at
  before update on public.itens_precificaveis
  for each row execute function public.set_updated_at();

-- Garante no máximo um item marcado como TSS
create unique index uq_itens_precificaveis_tss on public.itens_precificaveis (is_tss) where is_tss;

-- =============================================================================
-- 5. precos
--    Histórico de preço por item x forma de pagamento, com vigência por data.
--    Sem sobreposição de vigência para o mesmo (item, forma).
--    vigencia_fim NULL = vigente por tempo indeterminado.
-- =============================================================================
create table public.precos (
  id                  uuid primary key default gen_random_uuid(),
  item_id             uuid not null references public.itens_precificaveis (id) on delete cascade,
  forma_pagamento_id  uuid not null references public.formas_pagamento (id) on delete cascade,
  valor               numeric(12,2) not null check (valor >= 0),
  vigencia_inicio     date not null,
  vigencia_fim        date,
  criado_por          uuid references public.usuarios (id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint precos_vigencia_valida check (vigencia_fim is null or vigencia_fim > vigencia_inicio),
  constraint precos_sem_sobreposicao exclude using gist (
    item_id with =,
    forma_pagamento_id with =,
    daterange(vigencia_inicio, vigencia_fim, '[)') with &&
  )
);
create trigger trg_precos_updated_at
  before update on public.precos
  for each row execute function public.set_updated_at();

create index idx_precos_item_forma on public.precos (item_id, forma_pagamento_id, vigencia_inicio desc);

-- =============================================================================
-- 6. orcamentos
--    Um orçamento pertence a um condomínio e tem UMA forma de pagamento.
--    Snapshots gravados no momento da criação (não recalculam depois):
--      total_unidades  -> divisor usado no rateio de TSS
--      valor_tss       -> valor do TSS na forma escolhida
--      valor_total     -> total calculado do orçamento
-- =============================================================================
create table public.orcamentos (
  id                    uuid primary key default gen_random_uuid(),
  numero                text not null unique,               -- ex.: "091.2026"
  ano                   integer not null,
  data_orcamento        date not null default current_date,
  condominio_id         uuid not null references public.condominios (id),
  forma_pagamento_id    uuid not null references public.formas_pagamento (id),
  template_texto_id     uuid,  -- FK adicionada no fim do arquivo (templates_texto criada depois)
  status                text not null default 'rascunho'
                          check (status in ('rascunho', 'enviado', 'aprovado', 'recusado', 'cancelado')),
  prazo                 text,                               -- texto livre de prazo de execução
  observacoes           text,
  -- snapshots de cálculo (congelados na criação) -----------------------------
  total_unidades        integer check (total_unidades is null or total_unidades > 0),
  valor_tss             numeric(12,2) check (valor_tss is null or valor_tss >= 0),
  valor_total           numeric(14,2) check (valor_total is null or valor_total >= 0),
  -- auditoria --------------------------------------------------------------
  criado_por            uuid references public.usuarios (id),
  atualizado_por        uuid references public.usuarios (id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger trg_orcamentos_updated_at
  before update on public.orcamentos
  for each row execute function public.set_updated_at();

create index idx_orcamentos_condominio on public.orcamentos (condominio_id);
create index idx_orcamentos_status on public.orcamentos (status);

-- FK deferida de template (templates_texto é criada mais abaixo) -------------
-- (resolvida no fim do arquivo com ALTER TABLE)

-- =============================================================================
-- 7. tipos_apartamento
--    Cada orçamento é dividido em 1+ tipos de apartamento.
--    unidades = quantidade de apartamentos daquele tipo (informado manualmente).
--    valor_por_apartamento = snapshot do valor calculado por apto:
--      (Σ qtd_item x valor_item) + (valor_tss / total_unidades)
-- =============================================================================
create table public.tipos_apartamento (
  id                     uuid primary key default gen_random_uuid(),
  orcamento_id           uuid not null references public.orcamentos (id) on delete cascade,
  nome                   text not null,                     -- "Apartamento padrão", "Cobertura 111..114"
  unidades               integer not null check (unidades > 0),
  ordem                  integer not null default 0,
  valor_por_apartamento  numeric(14,2) check (valor_por_apartamento is null or valor_por_apartamento >= 0),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create trigger trg_tipos_apartamento_updated_at
  before update on public.tipos_apartamento
  for each row execute function public.set_updated_at();

create index idx_tipos_apartamento_orcamento on public.tipos_apartamento (orcamento_id);

-- =============================================================================
-- 8. tipo_apartamento_itens
--    Composição de itens/pontos de cada tipo de apartamento (manual, sem regra
--    automática). Ex.: 2 Hidrômetros + 1 Válvula Hidra.
-- =============================================================================
create table public.tipo_apartamento_itens (
  id                    uuid primary key default gen_random_uuid(),
  tipo_apartamento_id   uuid not null references public.tipos_apartamento (id) on delete cascade,
  item_id               uuid not null references public.itens_precificaveis (id),
  quantidade            integer not null check (quantidade >= 0),
  ordem                 integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (tipo_apartamento_id, item_id)
);
create trigger trg_tipo_apartamento_itens_updated_at
  before update on public.tipo_apartamento_itens
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 9. orcamento_valores_congelados
--    Preço unitário praticado no momento da criação do orçamento, por
--    (item, forma de pagamento). É a fonte de verdade para reimprimir /
--    reeditar orçamentos antigos sem sofrer alteração da tabela global.
-- =============================================================================
create table public.orcamento_valores_congelados (
  id                    uuid primary key default gen_random_uuid(),
  orcamento_id          uuid not null references public.orcamentos (id) on delete cascade,
  item_id               uuid not null references public.itens_precificaveis (id),
  forma_pagamento_id    uuid not null references public.formas_pagamento (id),
  valor_unitario        numeric(12,2) not null check (valor_unitario >= 0),
  preco_id              uuid references public.precos (id),   -- origem do valor (se aplicável)
  congelado_em          timestamptz not null default now(),
  unique (orcamento_id, item_id, forma_pagamento_id)
);
create index idx_valores_congelados_orcamento on public.orcamento_valores_congelados (orcamento_id);

-- =============================================================================
-- 10. historico_alteracoes
--     Log de auditoria. orcamento_id é opcional (permite logar mudanças em
--     tabelas globais como precos / itens_precificaveis).
-- =============================================================================
create table public.historico_alteracoes (
  id            uuid primary key default gen_random_uuid(),
  orcamento_id  uuid references public.orcamentos (id) on delete cascade,
  entidade      text not null,                       -- nome da tabela afetada
  entidade_id   uuid,
  acao          text not null check (acao in ('criar', 'atualizar', 'excluir')),
  campo         text,                                -- campo alterado (opcional)
  valor_antes   jsonb,
  valor_depois  jsonb,
  descricao     text,
  alterado_por  uuid references public.usuarios (id),
  alterado_em   timestamptz not null default now()
);
create index idx_historico_orcamento on public.historico_alteracoes (orcamento_id, alterado_em desc);
create index idx_historico_entidade on public.historico_alteracoes (entidade, entidade_id);

-- =============================================================================
-- 11. gerenciamento_mensal
--     Cobrança recorrente "gerenciamento mensal de leitura e monitoramento",
--     cobrada POR HIDRÔMETRO instalado. Valor varia por orçamento/contrato
--     (ex.: Queluz R$ 4,00; Aurora R$ 7,00) -> NÃO é constante do sistema.
--     1:1 com orçamento.
-- =============================================================================
create table public.gerenciamento_mensal (
  id                      uuid primary key default gen_random_uuid(),
  orcamento_id            uuid not null unique references public.orcamentos (id) on delete cascade,
  valor_por_hidrometro    numeric(12,2) not null check (valor_por_hidrometro >= 0),
  qtd_hidrometros         integer check (qtd_hidrometros is null or qtd_hidrometros >= 0),  -- snapshot opcional
  valor_total_mensal      numeric(14,2) check (valor_total_mensal is null or valor_total_mensal >= 0),
  observacao              text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create trigger trg_gerenciamento_mensal_updated_at
  before update on public.gerenciamento_mensal
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 12. templates_texto
--     Textos fixos do PDF (seções 1 a 6 + garantia). São sempre iguais entre
--     condomínios -> modelo único reaproveitável. Editável como "modelo".
-- =============================================================================
create table public.templates_texto (
  id                             uuid primary key default gen_random_uuid(),
  nome                           text not null,             -- ex.: "Padrão 2026"
  is_padrao                      boolean not null default false,
  sec_individualizacao_agua      text,
  sec_objetivo                   text,
  sec_procedimento_tecnico       text,
  sec_intervencao                text,
  sec_tramites_administrativos   text,
  sec_gerenciamento_mensal       text,
  sec_garantia                   text,
  ativo                          boolean not null default true,
  created_at                     timestamptz not null default now(),
  updated_at                     timestamptz not null default now()
);
create trigger trg_templates_texto_updated_at
  before update on public.templates_texto
  for each row execute function public.set_updated_at();

-- Garante no máximo um template marcado como padrão
create unique index uq_templates_texto_padrao on public.templates_texto (is_padrao) where is_padrao;

-- =============================================================================
-- FK pendente: orcamentos.template_texto_id -> templates_texto.id
-- =============================================================================
alter table public.orcamentos
  add constraint orcamentos_template_texto_fk
  foreign key (template_texto_id) references public.templates_texto (id);

-- >>>>>>>>>>>>>>>>>>>>  0002_rls.sql  <<<<<<<<<<<<<<<<<<<<
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

-- >>>>>>>>>>>>>>>>>>>>  0003_grants.sql  <<<<<<<<<<<<<<<<<<<<
-- =============================================================================
-- Hydrojexe - Sistema de Orçamentos
-- Migration 0003 - GRANTs para as roles da API do Supabase
-- =============================================================================
-- Normalmente o Supabase concede estes privilégios automaticamente (default
-- privileges do role `postgres`). Neste projeto não vieram, então concedemos
-- explicitamente e ajustamos os default privileges para objetos futuros.
--
-- Modelo de acesso:
--   service_role  -> acesso total, ignora RLS (uso server-side confiável)
--   authenticated -> DML liberado; o que cada um enxerga/altera é filtrado pela RLS
--   anon          -> sem acesso a dados nesta fase (sem GRANT + RLS)
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- Tabelas / sequences / funções já existentes -------------------------------
grant all privileges on all tables    in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- Objetos criados no futuro herdam os mesmos privilégios --------------------
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant all on sequences to service_role;
alter default privileges in schema public
  grant all on functions to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
alter default privileges in schema public
  grant execute on functions to authenticated;

-- >>>>>>>>>>>>>>>>>>>>  0004_auth.sql  <<<<<<<<<<<<<<<<<<<<
-- =============================================================================
-- Hydrojexe - Sistema de Orçamentos
-- Migration 0004 - Integração com Supabase Auth
-- =============================================================================
-- Toda conta em auth.users ganha automaticamente uma linha em public.usuarios.
-- nome e perfil vêm do user_metadata definido na criação (auth.admin.createUser):
--   user_metadata: { nome: "...", perfil: "comercial" | "admin" }
-- Sem metadata: nome = parte antes do @ do e-mail; perfil = 'comercial'.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nome, email, perfil)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'nome', ''), split_part(new.email, '@', 1)),
    new.email,
    case when new.raw_user_meta_data->>'perfil' = 'admin' then 'admin' else 'comercial' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mantém o e-mail de public.usuarios em sincronia com auth.users -------------
create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.usuarios set email = new.email, updated_at = now() where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_update();

-- >>>>>>>>>>>>>>>>>>>>  0005_rls_perfis.sql  <<<<<<<<<<<<<<<<<<<<
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

-- >>>>>>>>>>>>>>>>>>>>  0006_precos_fn.sql  <<<<<<<<<<<<<<<<<<<<
-- =============================================================================
-- Hydrojexe - Sistema de Orçamentos
-- Migration 0006 - Função para aplicar uma nova tabela de preços em bloco
-- =============================================================================
-- aplicar_tabela_precos(p_vigencia, p_precos) -> nº de células efetivamente alteradas
--
--   Para cada célula {item_id, forma_pagamento_id, valor}:
--     - linha ABERTA que começa exatamente em p_vigencia  -> atualiza o valor;
--     - valor igual ao já vigente                          -> ignora (não polui histórico);
--     - caso contrário -> fecha a vigência aberta anterior (vigencia_fim = p_vigencia)
--       e insere a nova linha [p_vigencia, ∞).
--   Rejeita se já existir qualquer preço com vigência de início POSTERIOR a
--   p_vigencia (nova tabela não pode ser retroativa a uma já cadastrada).
--
--   security invoker: a RLS de `precos` (escrita só admin) continua valendo.
-- =============================================================================

create or replace function public.aplicar_tabela_precos(
  p_vigencia date,
  p_precos   jsonb
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  r record;
  alteradas integer := 0;
begin
  if p_vigencia is null then
    raise exception 'Informe a data de início de vigência.' using errcode = 'check_violation';
  end if;

  if jsonb_typeof(p_precos) <> 'array' or jsonb_array_length(p_precos) = 0 then
    raise exception 'Nenhum preço informado.' using errcode = 'check_violation';
  end if;

  if exists (select 1 from public.precos where vigencia_inicio > p_vigencia) then
    raise exception 'Já existe tabela de preços com vigência posterior a %. Escolha outra data.', p_vigencia
      using errcode = 'check_violation';
  end if;

  for r in
    select (e->>'item_id')::uuid            as item_id,
           (e->>'forma_pagamento_id')::uuid as forma_pagamento_id,
           round((e->>'valor')::numeric, 2) as valor
    from jsonb_array_elements(p_precos) e
  loop
    if r.item_id is null or r.forma_pagamento_id is null or r.valor is null then
      raise exception 'Célula inválida no payload de preços.' using errcode = 'check_violation';
    end if;
    if r.valor < 0 then
      raise exception 'Valor negativo não é permitido.' using errcode = 'check_violation';
    end if;

    -- reedição no mesmo dia
    update public.precos
       set valor = r.valor, updated_at = now()
     where item_id = r.item_id
       and forma_pagamento_id = r.forma_pagamento_id
       and vigencia_inicio = p_vigencia
       and vigencia_fim is null
       and valor is distinct from r.valor;
    if found then
      alteradas := alteradas + 1;
      continue;
    end if;

    -- valor já vigente e igual -> nada a fazer
    if exists (
      select 1 from public.precos
       where item_id = r.item_id
         and forma_pagamento_id = r.forma_pagamento_id
         and vigencia_fim is null
         and vigencia_inicio <= p_vigencia
         and valor = r.valor
    ) then
      continue;
    end if;

    -- fecha a vigência aberta anterior e cria a nova
    update public.precos
       set vigencia_fim = p_vigencia, updated_at = now()
     where item_id = r.item_id
       and forma_pagamento_id = r.forma_pagamento_id
       and vigencia_fim is null
       and vigencia_inicio < p_vigencia;

    insert into public.precos (item_id, forma_pagamento_id, valor, vigencia_inicio, vigencia_fim)
    values (r.item_id, r.forma_pagamento_id, r.valor, p_vigencia, null);

    alteradas := alteradas + 1;
  end loop;

  return alteradas;
end;
$$;

grant execute on function public.aplicar_tabela_precos(date, jsonb) to authenticated, service_role;


-- >>>>>>>>>>>>>>>>>>>>  seed.sql (catalogo + linha Padrao de templates_texto)  <<<<<<<<<<<<<<<<<<<<
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

-- >>>>>>>>>>>>>>>>>>>>  0007_templates_seed.sql  <<<<<<<<<<<<<<<<<<<<
-- =============================================================================
-- Hydrojexe - Sistema de Orçamentos
-- Migration 0007 - Textos fixos do PDF no template "Padrão"
-- =============================================================================
-- Transcrito de "exemplo - orçamento queluz.pdf". São os textos que se repetem
-- em todo orçamento (seções 1 a 6 + garantia). Editáveis depois por uma tela
-- de "modelos de texto".
-- =============================================================================

update public.templates_texto set
  sec_individualizacao_agua = $txt$Análise técnica: Trata-se de um edifício com as tubulações em PVC distribuídas verticalmente por colunas, alimentado cozinha e banheiros com vasos sanitários de caixa acoplada.

Pontos de desperdício de água no condomínio:
a) Rateio coletivo da conta de água, sem a responsabilidade pelo pagamento real ao que cada morador utilizou;
b) Morosidade para sanar pequenos vazamentos em torneiras e válvulas;
c) Hábitos "peculiares" como lavar roupa diariamente, tomar banhos muito demorados, escovar os dentes com a torneira aberta....$txt$,

  sec_objetivo = $txt$a) Reduzir a conta de água do condomínio em 30% a 40%;
b) Monitorar os apartamentos com possíveis focos de vazamentos de forma eletrônica;
c) Fazer justiça com os moradores pagando sua conta de água apenas pelo seu próprio consumo;
d) Possibilitar cada morador controlar e monitorar seu consumo de acordo com sua expectativa.$txt$,

  sec_procedimento_tecnico = $txt$a) Análise preliminar do abastecimento e distribuição de água do condomínio e execução de mapeamento com plano de ação para a intervenção.
b) Emissão de comunicado formal aos condôminos orientando quanto aos procedimentos executivos de intervenção em cada unidade residencial e disponibilizando o agendamento das vistorias internas.
c) Emissão de relatório de constatação de cada unidade alvo de intervenção em duas vias para identificação da pressão nos pontos internos, eventuais patologias pré-existentes e possíveis empecilhos.
d) Apresentação de cronograma detalhado da obra e agendamento individual de cada intervenção.$txt$,

  sec_intervencao = $txt$a) Instalação de hidrômetros de 2,5m³ com bitola de 3/4 equipados com sensor de telemetria. O Hidrômetro será provido de selo de inspeção do Inmetro e obedecerá às regulamentações da ABNT. O sensor será provido de selo de aprovação da Anatel.$txt$,

  sec_tramites_administrativos = $txt$a) Após a montagem e instalação de todos os hidrômetros, emitiremos um relatório de conclusão liberando o condomínio a iniciar a medição e gerenciamento de consumo mensal.
b) Decorridos 30 (trinta) dias a contar pelo vencimento da conta de água consecutiva a conclusão, apresentaremos um relatório de consumo de água individual do mês vigente em caráter de orientação. Com isso, os moradores tomarão conhecimento do consumo individual de cada unidade e a partir de então passarão a arcar individualmente com a conta de água em acordo com seu consumo real.$txt$,

  sec_gerenciamento_mensal = $txt$a) Mensalmente realizaremos a medição dos hidrômetros via telemetria obtendo as informações de consumo rateadas e repassaremos para a administradora do condomínio poder incluir no boleto mensal de taxa condominial.
b) O sistema estará equipado com sensores que identificam qualquer tentativa de fraude na leitura, ou ainda o surgimento de vazamentos ou qualquer outra anomalia.
c) Consultoria mensal para avaliação do sistema, do consumo e estratégias de economia de água.
d) Disponibilidade do site na internet para que cada morador possa acompanhar seu consumo mensal detalhado.$txt$,

  sec_garantia = $txt$a) Os serviços hidráulicos executados têm garantia de 01 (um) ano salvo danos ocasionados por terceiros.
b) Os equipamentos possuem garantia de 02 (dois) anos sob responsabilidade da fabricante.
c) Os valores dos hidrômetros possuem validade até 30 dias após sua execução.$txt$,

  updated_at = now()
where is_padrao;

-- >>>>>>>>>>>>>>>>>>>>  0008_orcamento_incluir_tss.sql  <<<<<<<<<<<<<<<<<<<<
-- =============================================================================
-- Hydrojexe - Sistema de Orçamentos
-- Migration 0008 - TSS opcional por orçamento
-- =============================================================================
-- Nem todo condomínio contrata o TSS. Quando incluir_tss = false, não há
-- rateio de TSS: o valor por apartamento é apenas a soma dos itens.
-- default true para manter o comportamento atual (e o caso mais comum).
-- =============================================================================

alter table public.orcamentos
  add column if not exists incluir_tss boolean not null default true;

-- >>>>>>>>>>>>>>>>>>>>  0009_orcamento_multiforma.sql  <<<<<<<<<<<<<<<<<<<<
-- =============================================================================
-- Hydrojexe - Sistema de Orçamentos
-- Migration 0009 - Orçamento sem "forma escolhida"; 24x opcional no PDF
-- =============================================================================
-- O orçamento não elege mais uma forma de pagamento. Ao salvar, os preços das
-- 4 formas próprias (à vista, 6x, 9x, 12x) são congelados. O PDF mostra as 4;
-- o 24x só entra se incluir_24x = true (reaproveita os preços de 12x).
-- Snapshots (valor_total, valor_tss, valor_por_apartamento) passam a ser os
-- valores À VISTA, por convenção.
-- =============================================================================

alter table public.orcamentos drop column if exists forma_pagamento_id;

alter table public.orcamentos
  add column if not exists incluir_24x boolean not null default false;

-- >>>>>>>>>>>>>>>>>>>>  0010_formas_extras_administradora.sql  <<<<<<<<<<<<<<<<<<<<
-- =============================================================================
-- Hydrojexe - Sistema de Orçamentos
-- Migration 0010 - Formas de pagamento extras por orçamento + administradora
-- =============================================================================
-- parcelas_custom: lista de nº de parcelas extras (ex.: {18,24,36}). Cada uma
-- vira uma opção a mais no PDF, com base nos preços de 12x, entrada 10% +
-- N parcelas iguais. Substitui o antigo incluir_24x (basta adicionar 24).
-- =============================================================================

alter table public.orcamentos drop column if exists incluir_24x;

alter table public.orcamentos
  add column if not exists parcelas_custom integer[] not null default '{}';

alter table public.condominios
  add column if not exists administradora text;

-- >>>>>>>>>>>>>>>>>>>>  0011_tipo_proposta.sql  <<<<<<<<<<<<<<<<<<<<
-- =============================================================================
-- Hydrojexe - Sistema de Orçamentos
-- Migration 0011 - Tipo de proposta (modelos por situação)
-- =============================================================================
-- tipo_proposta:
--   completa            -> individualização completa (modelo Queluz — o atual)
--   gestao_mensal_agua  -> gestão/leitura mensal de água (sem instalação)
--   gestao_mensal_gas   -> gestão/leitura mensal de gás
--   tss_light           -> TSS Light (equipamento concentrador)
--
-- modelos_proposta: textos fixos das seções dos modelos NÃO-completa
--   (o "completa" continua usando public.templates_texto).
-- =============================================================================

alter table public.orcamentos
  add column if not exists tipo_proposta text not null default 'completa'
    check (tipo_proposta in (
      'completa', 'gestao_mensal_agua', 'gestao_mensal_gas', 'tss_light'
    ));

-- usado pelo TSS Light
alter table public.orcamentos
  add column if not exists qtd_equipamentos integer
    check (qtd_equipamentos is null or qtd_equipamentos > 0);

create table if not exists public.modelos_proposta (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null unique
                check (tipo in ('gestao_mensal_agua', 'gestao_mensal_gas', 'tss_light')),
  nome        text not null,
  secoes      jsonb not null default '[]',   -- [{ "titulo": "...", "corpo": "..." }]
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_modelos_proposta_updated_at on public.modelos_proposta;
create trigger trg_modelos_proposta_updated_at
  before update on public.modelos_proposta
  for each row execute function public.set_updated_at();

alter table public.modelos_proposta enable row level security;
alter table public.modelos_proposta force row level security;

create policy modelos_proposta_select on public.modelos_proposta
  for select to authenticated using (true);
create policy modelos_proposta_admin_insert on public.modelos_proposta
  for insert to authenticated with check (public.is_admin());
create policy modelos_proposta_admin_update on public.modelos_proposta
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy modelos_proposta_admin_delete on public.modelos_proposta
  for delete to authenticated using (public.is_admin());

grant select, insert, update, delete on public.modelos_proposta to authenticated;
grant all on public.modelos_proposta to service_role;

-- >>>>>>>>>>>>>>>>>>>>  0012_gestao_mensal.sql  <<<<<<<<<<<<<<<<<<<<
-- =============================================================================
-- 0012_gestao_mensal.sql
-- Etapa 8b-2 — propostas de "gestão mensal" (água / gás), leitura visual.
-- Fluxo enxuto: sem tipos de apartamento, sem parcelamento.
--   valor_por_hidrometro  -> valor mensal por apartamento (R$/mês)
--   qtd_hidrometros       -> total de pontos lidos (snapshot)
--   valor_total_mensal    -> total mensal (snapshot)
-- Faltavam só os dados usados no texto do PDF:
-- =============================================================================
alter table public.gerenciamento_mensal
  add column if not exists qtd_apartamentos integer
    check (qtd_apartamentos is null or qtd_apartamentos > 0);

alter table public.gerenciamento_mensal
  add column if not exists pontos_por_apartamento integer not null default 1
    check (pontos_por_apartamento > 0);

-- >>>>>>>>>>>>>>>>>>>>  0013_tss_light.sql  <<<<<<<<<<<<<<<<<<<<
-- =============================================================================
-- 0013_tss_light.sql
-- Etapa 8b-3 — proposta "TSS Light".
-- Fluxo enxuto: qtd de equipamentos (usa orcamentos.qtd_equipamentos, de 0011)
-- + até 4 opções de investimento. Cada opção: valor por unidade + nº de
-- parcelas (0/1 = à vista; N = "Em 0Nx de R$ valor/N", SEM entrada).
-- =============================================================================
alter table public.orcamentos
  add column if not exists tss_opcoes jsonb not null default '[]';
  -- formato: [{ "valor": 3000, "parcelas": 1 }, { "valor": 3240, "parcelas": 6 }, ...]

-- >>>>>>>>>>>>>>>>>>>>  0014_individualizacao_gas.sql  <<<<<<<<<<<<<<<<<<<<
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

-- >>>>>>>>>>>>>>>>>>>>  0015_modelos_proposta_intro.sql  <<<<<<<<<<<<<<<<<<<<
-- =============================================================================
-- 0015_modelos_proposta_intro.sql
-- Texto de abertura editável (antes das seções). Hoje só a "individualização de
-- gás" usa — é a "Análise técnica: Trata-se de um edifício ..." que varia por
-- condomínio. Enquanto nulo, usa o padrão do código.
-- =============================================================================
alter table public.modelos_proposta
  add column if not exists intro text;

-- >>>>>>>>>>>>>>>>>>>>  0016_salvar_montagem_fn.sql  <<<<<<<<<<<<<<<<<<<<
-- =============================================================================
-- 0016_salvar_montagem_fn.sql
-- salvar_montagem_orcamento(...) — grava a montagem do orçamento "completo"
-- (tipos + composição + preços congelados + snapshots + gerenciamento +
-- histórico) numa ÚNICA transação. Substitui a sequência de ~10 queries do
-- server action salvarOrcamento. O cálculo continua no TS; a função só persiste.
--
-- security invoker: a RLS das tabelas envolvidas continua valendo (o usuário
-- autenticado já tem permissão de escrita nelas pelas políticas de 0005).
-- =============================================================================
create or replace function public.salvar_montagem_orcamento(
  p_id               uuid,
  p_tipos            jsonb,   -- [{nome,unidades,ordem,valor_por_apartamento,itens:[{item_id,quantidade,ordem}]}]
  p_congelados       jsonb,   -- [{item_id,forma_pagamento_id,valor_unitario,preco_id}]
  p_total_unidades   integer,
  p_valor_tss        numeric,
  p_valor_total      numeric,
  p_gm_qtd           integer,
  p_gm_total_mensal  numeric,
  p_hist             jsonb    -- {valor_antes,valor_depois,descricao,alterado_por}
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  t         jsonb;
  ci        jsonb;
  v_tipo_id uuid;
  v_autor   uuid := nullif(p_hist->>'alterado_por','')::uuid;
begin
  if p_id is null then
    raise exception 'Orçamento inválido.' using errcode = 'check_violation';
  end if;

  delete from public.tipos_apartamento where orcamento_id = p_id;

  for t in select * from jsonb_array_elements(coalesce(p_tipos, '[]'::jsonb))
  loop
    insert into public.tipos_apartamento
      (orcamento_id, nome, unidades, ordem, valor_por_apartamento)
    values
      (p_id, t->>'nome', (t->>'unidades')::int, (t->>'ordem')::int,
       (t->>'valor_por_apartamento')::numeric)
    returning id into v_tipo_id;

    for ci in select * from jsonb_array_elements(coalesce(t->'itens', '[]'::jsonb))
    loop
      insert into public.tipo_apartamento_itens
        (tipo_apartamento_id, item_id, quantidade, ordem)
      values
        (v_tipo_id, (ci->>'item_id')::uuid, (ci->>'quantidade')::int,
         (ci->>'ordem')::int);
    end loop;
  end loop;

  if jsonb_array_length(coalesce(p_congelados, '[]'::jsonb)) > 0 then
    insert into public.orcamento_valores_congelados
      (orcamento_id, item_id, forma_pagamento_id, valor_unitario, preco_id)
    select p_id,
           (e->>'item_id')::uuid,
           (e->>'forma_pagamento_id')::uuid,
           (e->>'valor_unitario')::numeric,
           nullif(e->>'preco_id','')::uuid
    from jsonb_array_elements(p_congelados) e
    on conflict (orcamento_id, item_id, forma_pagamento_id)
    do update set valor_unitario = excluded.valor_unitario,
                  preco_id       = excluded.preco_id;
  end if;

  update public.orcamentos
     set total_unidades = p_total_unidades,
         valor_tss      = p_valor_tss,
         valor_total    = p_valor_total,
         atualizado_por = v_autor
   where id = p_id;

  update public.gerenciamento_mensal
     set qtd_hidrometros    = p_gm_qtd,
         valor_total_mensal = p_gm_total_mensal
   where orcamento_id = p_id;

  insert into public.historico_alteracoes
    (orcamento_id, entidade, entidade_id, acao, campo,
     valor_antes, valor_depois, descricao, alterado_por)
  values
    (p_id, 'orcamentos', p_id, 'atualizar', 'composicao',
     p_hist->'valor_antes', p_hist->'valor_depois', p_hist->>'descricao', v_autor);
end;
$$;

grant execute on function public.salvar_montagem_orcamento(
  uuid, jsonb, jsonb, integer, numeric, numeric, integer, numeric, jsonb
) to authenticated, service_role;

-- >>>>>>>>>>>>>>>>>>>>  0017_intervencao_medidor_dinamicos.sql  <<<<<<<<<<<<<<<<<<<<
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

-- >>>>>>>>>>>>>>>>>>>>  0018_condominio_agua_preparado.sql  <<<<<<<<<<<<<<<<<<<<
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

-- >>>>>>>>>>>>>>>>>>>>  0019_limpa_quebras_individualizacao_agua.sql  <<<<<<<<<<<<<<<<<<<<
-- O texto-modelo de individualização de água tinha "\n\n\r\n" antes de
-- "Pontos de desperdício...", o que gerava DUAS linhas em branco no PDF
-- (espaçamento exagerado após a Análise técnica). Regrava o bloco só com
-- \n. A renderização do PDF também passou a normalizar \r\n e a colapsar
-- linhas em branco, mas manter o valor limpo no banco evita a pegadinha.
update public.templates_texto set
  sec_individualizacao_agua =
    '{analise_tecnica}' || E'\n\n' ||
    'Pontos de desperdício de água no condomínio:' || E'\n' ||
    'a) Rateio coletivo da conta de água, sem a responsabilidade pelo pagamento real ao que cada morador utilizou;' || E'\n' ||
    'b) Morosidade para sanar pequenos vazamentos em torneiras e válvulas;' || E'\n' ||
    'c) Hábitos "peculiares" como lavar roupa diariamente, tomar banhos muito demorados, escovar os dentes com a torneira aberta....',
  updated_at = now()
where is_padrao;

-- >>>>>>>>>>>>>>>>>>>>  0020_formas_pagamento_visiveis.sql  <<<<<<<<<<<<<<<<<<<<
-- Seleção, por orçamento, de quais formas de pagamento base entram no PDF.
-- Guarda o nº de parcelas (1 = à vista, 6, 9, 12). Default = todas as 4.
-- Condições fora do padrão continuam via orcamentos.parcelas_custom.
alter table public.orcamentos
  add column if not exists formas_pagamento_visiveis int[]
    not null default array[1, 6, 9, 12];

-- >>>>>>>>>>>>>>>>>>>>  0021_intervencao_agua_nao_preparado.sql  <<<<<<<<<<<<<<<<<<<<
-- Seção INTERVENÇÃO do PDF de individualização de água quando o condomínio
-- NÃO é preparado (retrofit / prédio de válvula hidra): texto a)–h) do modelo
-- "Ed. Aurora", com marcadores de foto nos pontos exatos:
--   {foto_antes_depois}   -> antes/depois (hidra x caixa acoplada, com X)
--   {foto_revestimento}   -> exemplos de faixa de pastilha decorativa
--   {foto_hidrometro}     -> hidrômetro + selos ANATEL/INMETRO
--   {foto_caixa_inspecao} -> caixa de inspeção aberta/fechada + legenda
-- Preparado (shafts) continua usando sec_intervencao (com {hidrometros}).
alter table public.templates_texto
  add column if not exists sec_intervencao_agua_nao_preparado text;

update public.templates_texto set
  sec_intervencao_agua_nao_preparado =
    'a) Remoção completa do vaso sanitário existente e da tubulação de alimentação até o registro interno de distribuição.' || E'\n\n' ||
    '{foto_antes_depois}' || E'\n\n' ||
    'b) Instalação de tubulação hidráulica em bitola de 3/4" de água fria desde o registro interno até a lateral do vaso sanitário com saída de 3/4" para 1/2".' || E'\n\n' ||
    'c) Compatibilização do tubo de 100 mm de esgoto no piso (área sob o vaso) para o posicionamento de acordo com o novo vaso sanitário.' || E'\n\n' ||
    'd) Recomposição do reboco e contra-piso nos pontos sob intervenção.' || E'\n\n' ||
    'e) Assentamento de revestimento cerâmico no piso e nas paredes sobre os pontos modificados. O fornecimento do revestimento deverá ser por cada morador. Se a unidade tiver reserva de revestimento similar ao existente faremos a recomposição pontual. Caso não tenha, sugerimos o fornecimento de pastilha decorativa para fazer uma faixa vertical com lay-out contemporâneo.' || E'\n\n' ||
    '{foto_revestimento}' || E'\n\n' ||
    'f) Instalação de hidrômetros com bitola de 3/4" equipados com sensor de telemetria em todos os apartamentos, contemplando todos os banheiros (nos pontos de água fria e quente) e cozinha / área de serviço. Apenas as sacadas estarão associadas a área comum. O Hidrômetro será provido de selo de inspeção do Inmetro e obedecerá às regulamentações da ABNT. O sensor será provido de selo de aprovação da Anatel.' || E'\n\n' ||
    '{foto_hidrometro}' || E'\n\n' ||
    '{foto_caixa_inspecao}' || E'\n\n' ||
    'g) Execução de teste de estanqueidade em todo o sistema e medição de pressão nos pontos internos das unidades.' || E'\n\n' ||
    'h) Regularização interna com argamassa da superfície envoltória do tubo e do hidrômetro e instalação de capa plástica na cor branca para cobertura e ocultação dos equipamentos, preservando um acabamento estético de alto padrão.',
  updated_at = now()
where is_padrao;

-- >>>>>>>>>>>>>>>>>>>>  0022_condominio_parcelamento_especial.sql  <<<<<<<<<<<<<<<<<<<<
-- Parcelamento especial por condomínio: nas propostas desse condomínio, cada
-- faixa de parcelamento >= 9x usa o preço da faixa uma abaixo:
--   9x  -> preço da coluna 6x
--   12x -> preço da coluna 9x
--   24x -> preço da coluna 12x (já é o comportamento das "formas extras")
-- À vista e 6x não mudam.
alter table public.condominios
  add column if not exists parcelamento_especial boolean not null default false;

-- >>>>>>>>>>>>>>>>>>>>  0023_relatorios_historico.sql  <<<<<<<<<<<<<<<<<<<<
-- Novas funcionalidades: busca, histórico do condomínio, calculadora, relatórios.
-- Só acrescenta: nenhuma regra/cálculo existente é alterado.

-- 1. Quantidade de unidades no cadastro do condomínio (manual, opcional) --------
alter table public.condominios
  add column if not exists qtd_unidades integer
    check (qtd_unidades is null or qtd_unidades > 0);

-- 2. Snapshots completos do orçamento -----------------------------------------
--    Uma "foto" do orçamento é gravada automaticamente quando o status passa
--    para 'enviado' ou 'aprovado'. Nunca substitui a anterior.
create table if not exists public.orcamento_snapshots (
  id           uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null references public.orcamentos (id) on delete cascade,
  status       text not null,
  valor_total  numeric(14,2),
  dados        jsonb not null,
  criado_por   uuid references public.usuarios (id),
  criado_em    timestamptz not null default now()
);
create index if not exists idx_orcamento_snapshots_orcamento
  on public.orcamento_snapshots (orcamento_id, criado_em desc);

alter table public.orcamento_snapshots enable row level security;

drop policy if exists orcamento_snapshots_select on public.orcamento_snapshots;
create policy orcamento_snapshots_select on public.orcamento_snapshots
  for select to authenticated using (true);

drop policy if exists orcamento_snapshots_insert on public.orcamento_snapshots;
create policy orcamento_snapshots_insert on public.orcamento_snapshots
  for insert to authenticated with check (true);

-- >>>>>>>>>>>>>>>>>>>>  0024_individualizacao_agua_sem_tecnologia.sql  <<<<<<<<<<<<<<<<<<<<
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

-- >>>>>>>>>>>>>>>>>>>>  0025_obras_arquivar_envio.sql  <<<<<<<<<<<<<<<<<<<<
-- =============================================================================
-- 0025 — Arquivar (soft delete), rastreio de envio, link público do PDF e
--        módulo de Obra/instalação (checklist de apartamentos + materiais).
-- =============================================================================

-- Soft delete + rastreio de envio -------------------------------------------
alter table public.condominios add column if not exists arquivado_em timestamptz;
alter table public.orcamentos  add column if not exists arquivado_em timestamptz;
alter table public.orcamentos  add column if not exists enviado_em   timestamptz;
alter table public.orcamentos  add column if not exists token_publico uuid unique;

-- Obras --------------------------------------------------------------------
create table if not exists public.obras (
  id             uuid primary key default gen_random_uuid(),
  condominio_id  uuid not null references public.condominios(id) on delete cascade,
  orcamento_id   uuid references public.orcamentos(id),
  status         text not null default 'planejada'
                   check (status in ('planejada','em_andamento','concluida','pausada','cancelada')),
  previsao_inicio date,
  previsao_fim    date,
  outros_custos   numeric(14,2) not null default 0,
  observacoes     text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_obras_condominio on public.obras(condominio_id);

create table if not exists public.obra_apartamentos (
  id       uuid primary key default gen_random_uuid(),
  obra_id  uuid not null references public.obras(id) on delete cascade,
  identificacao text not null,
  status   text not null default 'pendente'
             check (status in ('pendente','agendado','concluido','impedido')),
  data_conclusao date,
  observacao text,
  ordem int not null default 0
);
create index if not exists idx_obra_apartamentos_obra on public.obra_apartamentos(obra_id);

create table if not exists public.obra_requisicoes (
  id       uuid primary key default gen_random_uuid(),
  obra_id  uuid not null references public.obras(id) on delete cascade,
  numero   text,
  data     date,
  anexo_path text,
  valor_total numeric(14,2) not null default 0,
  criado_por uuid references public.usuarios(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_obra_requisicoes_obra on public.obra_requisicoes(obra_id);

create table if not exists public.obra_materiais (
  id             uuid primary key default gen_random_uuid(),
  requisicao_id  uuid not null references public.obra_requisicoes(id) on delete cascade,
  descricao      text not null,
  quantidade     numeric(12,3) not null default 1,
  unidade        text,
  valor_unitario numeric(14,2) not null default 0,
  valor_total    numeric(14,2) not null default 0,
  ordem int not null default 0
);
create index if not exists idx_obra_materiais_requisicao on public.obra_materiais(requisicao_id);

alter table public.obras enable row level security;
alter table public.obra_apartamentos enable row level security;
alter table public.obra_requisicoes enable row level security;
alter table public.obra_materiais enable row level security;

do $$
declare t text;
begin
  foreach t in array array['obras','obra_apartamentos','obra_requisicoes','obra_materiais'] loop
    execute format('drop policy if exists %I_all on public.%I;', t, t);
    execute format('create policy %I_all on public.%I for all to authenticated using (true) with check (true);', t, t);
  end loop;
end $$;

-- Bucket privado para os PDFs das requisições ------------------------------
insert into storage.buckets (id, name, public)
  values ('requisicoes','requisicoes', false)
  on conflict (id) do nothing;

drop policy if exists requisicoes_rw on storage.objects;
create policy requisicoes_rw on storage.objects
  for all to authenticated
  using (bucket_id = 'requisicoes') with check (bucket_id = 'requisicoes');

-- >>>>>>>>>>>>>>>>>>>>  0026_obra_deducoes.sql  <<<<<<<<<<<<<<<<<<<<
-- =============================================================================
-- 0026 — Deduções da obra (impostos, retenções — campos livres) para o
--        resultado bruto x líquido de cada obra.
-- =============================================================================

create table if not exists public.obra_deducoes (
  id        uuid primary key default gen_random_uuid(),
  obra_id   uuid not null references public.obras(id) on delete cascade,
  descricao text not null,
  valor     numeric(14,2) not null default 0,
  ordem     int not null default 0
);
create index if not exists idx_obra_deducoes_obra on public.obra_deducoes(obra_id);

alter table public.obra_deducoes enable row level security;
drop policy if exists obra_deducoes_all on public.obra_deducoes;
create policy obra_deducoes_all on public.obra_deducoes
  for all to authenticated using (true) with check (true);

-- >>>>>>>>>>>>>>>>>>>>  0027_schema_migrations.sql  <<<<<<<<<<<<<<<<<<<<
-- =============================================================================
-- 0027 — Registro das migrações aplicadas.
-- As migrações são rodadas à mão no SQL Editor do Supabase. Esta tabela guarda
-- o que já foi aplicado, para não pular nem repetir uma ao montar outro ambiente.
--
-- Convenção: ao rodar uma migração nova, terminar com
--   insert into public.schema_migrations (version, descricao)
--     values ('00XX', 'resumo curto');
-- =============================================================================

create table if not exists public.schema_migrations (
  version     text primary key,
  descricao   text,
  aplicada_em timestamptz not null default now()
);

alter table public.schema_migrations enable row level security;

drop policy if exists schema_migrations_select on public.schema_migrations;
create policy schema_migrations_select on public.schema_migrations
  for select to authenticated using (true);

drop policy if exists schema_migrations_admin_write on public.schema_migrations;
create policy schema_migrations_admin_write on public.schema_migrations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Backfill do histórico até aqui -----------------------------------------------
insert into public.schema_migrations (version, descricao) values
  ('0001', 'schema'),
  ('0002', 'rls'),
  ('0003', 'grants'),
  ('0004', 'auth'),
  ('0005', 'rls perfis'),
  ('0006', 'precos fn'),
  ('0007', 'templates seed'),
  ('0008', 'orcamento incluir tss'),
  ('0009', 'orcamento multiforma'),
  ('0010', 'formas extras administradora'),
  ('0011', 'tipo proposta'),
  ('0012', 'gestao mensal'),
  ('0013', 'tss light'),
  ('0014', 'individualizacao gas'),
  ('0015', 'modelos proposta intro'),
  ('0016', 'salvar montagem fn'),
  ('0017', 'intervencao medidor dinamicos'),
  ('0018', 'condominio agua preparado'),
  ('0019', 'limpa quebras individualizacao agua'),
  ('0020', 'formas pagamento visiveis'),
  ('0021', 'intervencao agua nao preparado'),
  ('0022', 'condominio parcelamento especial'),
  ('0023', 'relatorios historico'),
  ('0024', 'individualizacao agua sem tecnologia'),
  ('0025', 'obras arquivar envio'),
  ('0026', 'obra deducoes'),
  ('0027', 'schema migrations')
on conflict (version) do nothing;

-- >>>>>>>>>>>>>>>>>>>>  0028_orcamento_cenario_agua.sql  <<<<<<<<<<<<<<<<<<<<
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

-- >>>>>>>>>>>>>>>>>>>>  0029_parcelamento_especial_longo.sql  <<<<<<<<<<<<<<<<<<<<
-- =============================================================================
-- 0029 — Segundo modo de parcelamento especial ("longo").
--
--   padrao  : 9x usa o preço de 6x,  12x usa o de 9x   (24x já usa o de 12x)
--   longo   : 12x usa o preço de 6x, 24x usa o de 9x,   36x usa o de 12x
--
-- Em ambos, à vista e 6x não mudam. O modo só vale quando o condomínio tem
-- parcelamento especial ligado (coluna parcelamento_especial).
-- =============================================================================

alter table public.condominios
  add column if not exists parcelamento_especial_modo text not null default 'padrao';

alter table public.condominios
  drop constraint if exists condominios_parcelamento_especial_modo_check;
alter table public.condominios
  add constraint condominios_parcelamento_especial_modo_check
  check (parcelamento_especial_modo in ('padrao', 'longo'));

insert into public.schema_migrations (version, descricao)
  values ('0029', 'parcelamento especial modo longo')
  on conflict (version) do nothing;

-- >>>>>>>>>>>>>>>>>>>>  0030_orcamento_qtd_tss.sql  <<<<<<<<<<<<<<<<<<<<
-- =============================================================================
-- 0030 — Quantidade de TSS por orçamento.
-- Prédios grandes podem precisar de mais de um concentrador TSS. O rateio por
-- apartamento passa a ser (preço do TSS × qtd_tss) ÷ nº de apartamentos.
-- Vale para individualização de água (completa) e individualização de gás,
-- e só tem efeito quando "Incluir TSS" está marcado.
-- =============================================================================

alter table public.orcamentos
  add column if not exists qtd_tss integer not null default 1;

alter table public.orcamentos
  drop constraint if exists orcamentos_qtd_tss_check;
alter table public.orcamentos
  add constraint orcamentos_qtd_tss_check check (qtd_tss >= 1 and qtd_tss <= 20);

insert into public.schema_migrations (version, descricao)
  values ('0030', 'orcamento qtd_tss')
  on conflict (version) do nothing;

-- >>>>>>>>>>>>>>>>>>>>  0031_parcelamento_especial_medio.sql  <<<<<<<<<<<<<<<<<<<<
-- =============================================================================
-- 0031 — Terceiro modo de parcelamento especial: "medio".
--   medio : 12x usa o preço de 9x, 18x usa o de 12x
--           (à vista, 6x e 9x não mudam)
-- =============================================================================

alter table public.condominios
  drop constraint if exists condominios_parcelamento_especial_modo_check;
alter table public.condominios
  add constraint condominios_parcelamento_especial_modo_check
  check (parcelamento_especial_modo in ('padrao', 'medio', 'longo'));

insert into public.schema_migrations (version, descricao)
  values ('0031', 'parcelamento especial modo medio')
  on conflict (version) do nothing;
