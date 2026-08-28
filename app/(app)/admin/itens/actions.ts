"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import {
  booleano,
  inteiro,
  mensagemErroBanco,
  texto,
  textoOuNulo,
  type FormState,
} from "@/lib/forms";
import { slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

const UNIDADES = ["ponto", "valvula", "orcamento"];

function parse(formData: FormData) {
  const nome = texto(formData, "nome");
  const slugInformado = texto(formData, "slug");
  const unidade = texto(formData, "unidade");
  return {
    nome,
    slug: slugify(slugInformado || nome),
    descricao: textoOuNulo(formData, "descricao"),
    unidade: UNIDADES.includes(unidade) ? unidade : "ponto",
    is_tss: booleano(formData, "is_tss"),
    ativo: booleano(formData, "ativo"),
    ordem: inteiro(formData, "ordem", 0),
  };
}

export async function criarItem(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const dados = parse(formData);
  if (!dados.nome) return { ok: false, error: "Informe o nome do item." };
  if (!dados.slug) return { ok: false, error: "Slug inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from("itens_precificaveis").insert(dados);
  if (error) return { ok: false, error: mensagemErroBanco(error) };

  revalidatePath("/admin/itens");
  return { ok: true, error: null };
}

export async function atualizarItem(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = texto(formData, "id");
  if (!id) return { ok: false, error: "Registro inválido." };
  const dados = parse(formData);
  if (!dados.nome) return { ok: false, error: "Informe o nome do item." };
  if (!dados.slug) return { ok: false, error: "Slug inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("itens_precificaveis")
    .update(dados)
    .eq("id", id);
  if (error) return { ok: false, error: mensagemErroBanco(error) };

  revalidatePath("/admin/itens");
  revalidatePath(`/admin/itens/${id}`);
  return { ok: true, error: null };
}

export async function excluirItem(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = texto(formData, "id");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("itens_precificaveis")
    .delete()
    .eq("id", id);
  if (error) {
    redirect(
      `/admin/itens/${id}?erro=${encodeURIComponent(mensagemErroBanco(error))}`,
    );
  }

  revalidatePath("/admin/itens");
  redirect("/admin/itens");
}
