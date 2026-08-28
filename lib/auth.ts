import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type Perfil = "comercial" | "admin";

export type UsuarioAtual = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
};

/**
 * Usuário autenticado + sua linha em public.usuarios. `null` se não houver
 * sessão válida ou se a conta não tiver registro/estiver inativa.
 * Memoizado por request (React cache).
 */
export const getUsuarioAtual = cache(async (): Promise<UsuarioAtual | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("usuarios")
    .select("id, nome, email, perfil, ativo")
    .eq("id", user.id)
    .single();

  if (!data || !data.ativo) return null;
  return data as UsuarioAtual;
});

/** Exige sessão. Redireciona para /login se não houver. */
export async function requireUsuario(): Promise<UsuarioAtual> {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  return usuario;
}

/** Exige perfil admin. Redireciona para / se for comercial, /login se deslogado. */
export async function requireAdmin(): Promise<UsuarioAtual> {
  const usuario = await requireUsuario();
  if (usuario.perfil !== "admin") redirect("/");
  return usuario;
}
