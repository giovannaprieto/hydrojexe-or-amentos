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
