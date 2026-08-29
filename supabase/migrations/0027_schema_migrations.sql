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
