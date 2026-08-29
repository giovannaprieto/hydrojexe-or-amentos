"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin, requireUsuario } from "@/lib/auth";
import {
  booleano,
  mensagemErroBanco,
  texto,
  textoOuNulo,
  type FormState,
} from "@/lib/forms";
import { diffCampos, registrarHistorico } from "@/lib/historico";
import type { Json } from "@/types/database";
import { createClient } from "@/lib/supabase/server";

function inteiroPositivoOuNulo(
  formData: FormData,
  campo: string,
): number | null {
  const v = texto(formData, campo);
  const n = Math.trunc(Number(v));
  return v !== "" && Number.isFinite(n) && n > 0 ? n : null;
}

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
    parcelamento_especial: booleano(formData, "parcelamento_especial"),
    qtd_unidades: inteiroPositivoOuNulo(formData, "qtd_unidades"),
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
  const usuario = await requireUsuario();
  const id = texto(formData, "id");
  if (!id) return { ok: false, error: "Registro inválido." };
  const dados = parse(formData);
  if (!dados.nome) return { ok: false, error: "Informe o nome do condomínio." };

  const supabase = await createClient();
  const { data: antes } = await supabase
    .from("condominios")
    .select(
      "nome, cnpj, endereco, cidade, uf, administradora, sindico_nome, contato_nome, contato_email, contato_telefone, observacoes, agua_preparado, parcelamento_especial, qtd_unidades",
    )
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("condominios")
    .update(dados)
    .eq("id", id);
  if (error) return { ok: false, error: mensagemErroBanco(error) };

  if (antes) {
    const dif = diffCampos(
      antes as unknown as Record<string, Json>,
      dados as unknown as Record<string, Json>,
    );
    if (dif.campos.length > 0) {
      await registrarHistorico(supabase, {
        orcamento_id: null,
        entidade: "condominios",
        entidade_id: id,
        acao: "atualizar",
        campo: dif.campos.join(", "),
        valor_antes: dif.antes,
        valor_depois: dif.depois,
        descricao: `Cadastro do condomínio atualizado (${dif.campos.join(", ")})`,
        alterado_por: usuario.id,
      });
    }
  }

  revalidatePath("/condominios");
  revalidatePath(`/condominios/${id}`);
  return { ok: true, error: null };
}

export async function arquivarCondominio(formData: FormData): Promise<void> {
  await requireUsuario();
  const id = texto(formData, "id");
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("condominios")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/condominios");
  revalidatePath(`/condominios/${id}`);
  redirect("/condominios");
}

export async function desarquivarCondominio(formData: FormData): Promise<void> {
  await requireUsuario();
  const id = texto(formData, "id");
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("condominios")
    .update({ arquivado_em: null })
    .eq("id", id);
  revalidatePath("/condominios");
  revalidatePath(`/condominios/${id}`);
}

export async function excluirCondominio(formData: FormData): Promise<void> {
  await requireAdmin();
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
