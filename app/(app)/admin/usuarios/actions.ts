"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type CriarUsuarioState = {
  ok: boolean;
  error: string | null;
  mensagem: string | null;
};

export async function criarUsuario(
  _prev: CriarUsuarioState,
  formData: FormData,
): Promise<CriarUsuarioState> {
  await requireAdmin();

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const perfil = String(formData.get("perfil") ?? "comercial");

  if (!nome || !email || !senha) {
    return { ok: false, error: "Preencha nome, e-mail e senha.", mensagem: null };
  }
  if (senha.length < 8) {
    return { ok: false, error: "A senha precisa ter ao menos 8 caracteres.", mensagem: null };
  }
  if (perfil !== "comercial" && perfil !== "admin") {
    return { ok: false, error: "Perfil inválido.", mensagem: null };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, perfil },
  });

  if (error) {
    return { ok: false, error: error.message, mensagem: null };
  }

  revalidatePath("/admin/usuarios");
  return { ok: true, error: null, mensagem: `Usuário ${email} criado.` };
}
