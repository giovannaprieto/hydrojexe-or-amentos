"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import {
  booleano,
  inteiro,
  mensagemErroBanco,
  texto,
  type FormState,
} from "@/lib/forms";
import { slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

function parse(formData: FormData) {
  const nome = texto(formData, "nome");
  const slugInformado = texto(formData, "slug");
  const usaPrecoDe = texto(formData, "usa_preco_de_forma_id");
  return {
    nome,
    slug: slugify(slugInformado || nome),
    num_parcelas: Math.max(1, inteiro(formData, "num_parcelas", 1)),
    usa_preco_de_forma_id: usaPrecoDe || null,
    ordem: inteiro(formData, "ordem", 0),
    ativo: booleano(formData, "ativo"),
  };
}

export async function criarForma(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const dados = parse(formData);
  if (!dados.nome) return { ok: false, error: "Informe o nome da forma." };
  if (!dados.slug) return { ok: false, error: "Slug inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from("formas_pagamento").insert(dados);
  if (error) return { ok: false, error: mensagemErroBanco(error) };

  revalidatePath("/admin/formas-pagamento");
  return { ok: true, error: null };
}

export async function atualizarForma(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = texto(formData, "id");
  if (!id) return { ok: false, error: "Registro inválido." };
  const dados = parse(formData);
  if (!dados.nome) return { ok: false, error: "Informe o nome da forma." };
  if (!dados.slug) return { ok: false, error: "Slug inválido." };
  if (dados.usa_preco_de_forma_id === id) {
    return { ok: false, error: "Uma forma não pode usar o preço dela mesma." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("formas_pagamento")
    .update(dados)
    .eq("id", id);
  if (error) return { ok: false, error: mensagemErroBanco(error) };

  revalidatePath("/admin/formas-pagamento");
  revalidatePath(`/admin/formas-pagamento/${id}`);
  return { ok: true, error: null };
}

export async function excluirForma(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = texto(formData, "id");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("formas_pagamento")
    .delete()
    .eq("id", id);
  if (error) {
    redirect(
      `/admin/formas-pagamento/${id}?erro=${encodeURIComponent(mensagemErroBanco(error))}`,
    );
  }

  revalidatePath("/admin/formas-pagamento");
  redirect("/admin/formas-pagamento");
}
