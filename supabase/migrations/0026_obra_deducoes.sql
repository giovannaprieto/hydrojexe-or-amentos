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
