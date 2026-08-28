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
