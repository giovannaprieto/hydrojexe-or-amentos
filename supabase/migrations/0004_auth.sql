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
