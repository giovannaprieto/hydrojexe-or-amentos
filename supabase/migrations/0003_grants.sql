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
