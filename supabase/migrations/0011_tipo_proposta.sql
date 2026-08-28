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
