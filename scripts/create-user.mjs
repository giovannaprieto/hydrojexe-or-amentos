/**
 * Cria um usuário no Supabase Auth (e, via trigger, em public.usuarios).
 * Use para criar o PRIMEIRO admin (bootstrap) ou usuários pelo terminal.
 *
 * Uso:
 *   node --env-file=.env.local scripts/create-user.mjs \
 *     --email pessoa@hydrojexe.com.br --senha "senhaForte123" --nome "Fulano" --perfil admin
 *
 * --perfil: comercial (padrão) | admin
 */
import { createClient } from "@supabase/supabase-js";

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i]?.replace(/^--/, "");
  if (key) args[key] = process.argv[i + 1];
}

const email = args.email;
const senha = args.senha ?? args.password;
const nome = args.nome ?? email?.split("@")[0];
const perfil = args.perfil === "admin" ? "admin" : "comercial";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !service) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (use --env-file=.env.local).");
  process.exit(1);
}
if (!email || !senha) {
  console.error("Uso: --email <e-mail> --senha <senha> [--nome <nome>] [--perfil comercial|admin]");
  process.exit(1);
}
if (senha.length < 8) {
  console.error("A senha precisa ter ao menos 8 caracteres.");
  process.exit(1);
}

const admin = createClient(url, service, { auth: { persistSession: false } });

const { data, error } = await admin.auth.admin.createUser({
  email,
  password: senha,
  email_confirm: true,
  user_metadata: { nome, perfil },
});

if (error) {
  console.error("Erro:", error.message);
  process.exit(1);
}

console.log(`OK: ${email} criado (perfil ${perfil}, id ${data.user.id}).`);
