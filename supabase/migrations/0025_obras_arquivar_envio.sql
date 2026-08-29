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
