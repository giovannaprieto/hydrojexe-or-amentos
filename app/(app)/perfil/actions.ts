"use server";

import { requireUsuario } from "@/lib/auth";
import { type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

export async function trocarSenha(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUsuario();

  const senha = String(formData.get("senha") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");

  if (senha.length < 8) {
    return { ok: false, error: "A senha precisa ter ao menos 8 caracteres." };
  }
  if (senha !== confirmar) {
    return { ok: false, error: "As senhas não conferem." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) {
    return { ok: false, error: "Não foi possível alterar a senha." };
  }

  return { ok: true, error: null, mensagem: "Senha alterada." };
}
