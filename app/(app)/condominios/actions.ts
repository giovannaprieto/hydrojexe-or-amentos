"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUsuario } from "@/lib/auth";
import {
  booleano,
  mensagemErroBanco,
  texto,
  textoOuNulo,
  type FormState,
} from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

function parse(formData: FormData) {
  const uf = textoOuNulo(formData, "uf");
  return {
    nome: texto(formData, "nome"),
    cnpj: textoOuNulo(formData, "cnpj"),
    endereco: textoOuNulo(formData, "endereco"),
    cidade: textoOuNulo(formData, "cidade"),
    uf: uf ? uf.toUpperCase().slice(0, 2) : null,
    administradora: textoOuNulo(formData, "administradora"),
    sindico_nome: textoOuNulo(formData, "sindico_nome"),
    contato_nome: textoOuNulo(formData, "contato_nome"),
    contato_email: textoOuNulo(formData, "contato_email"),
    contato_telefone: textoOuNulo(formData, "contato_telefone"),
    observacoes: textoOuNulo(formData, "observacoes"),
    agua_preparado: booleano(formData, "agua_preparado"),
  };
}

export async function criarCondominio(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUsuario();
  const dados = parse(formData);
  if (!dados.nome) return { ok: false, error: "Informe o nome do condomínio." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("condominios")
    .insert(dados)
    .select("id")
    .single();
  if (error) return { ok: false, error: mensagemErroBanco(error) };

  revalidatePath("/condominios");
  redirect(`/condominios/${data.id}`);
}

export async function atualizarCondominio(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUsuario();
  const id = texto(formData, "id");
  if (!id) return { ok: false, error: "Registro inválido." };
  const dados = parse(formData);
  if (!dados.nome) return { ok: false, error: "Informe o nome do condomínio." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("condominios")
    .update(dados)
    .eq("id", id);
  if (error) return { ok: false, error: mensagemErroBanco(error) };

  revalidatePath("/condominios");
  revalidatePath(`/condominios/${id}`);
  return { ok: true, error: null };
}

export async function excluirCondominio(formData: FormData): Promise<void> {
  await requireUsuario();
  const id = texto(formData, "id");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("condominios").delete().eq("id", id);
  if (error) {
    redirect(
      `/condominios/${id}?erro=${encodeURIComponent(mensagemErroBanco(error))}`,
    );
  }

  revalidatePath("/condominios");
  redirect("/condominios");
}
