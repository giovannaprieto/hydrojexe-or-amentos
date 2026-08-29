"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUsuario } from "@/lib/auth";
import {
  mensagemErroBanco,
  texto,
  textoOuNulo,
  type FormState,
} from "@/lib/forms";
import { VALORES_STATUS_OBRA } from "@/lib/obras";
import { createClient } from "@/lib/supabase/server";

const dec = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
const round2 = (n: number) => Math.round(n * 100) / 100;

export async function criarObra(formData: FormData): Promise<void> {
  await requireUsuario();
  const supabase = await createClient();
  const condominio_id = texto(formData, "condominio_id");
  if (!condominio_id) redirect("/obras?erro=Escolha%20o%20condom%C3%ADnio");
  const orcamento_id = textoOuNulo(formData, "orcamento_id");

  const { data, error } = await supabase
    .from("obras")
    .insert({ condominio_id, orcamento_id })
    .select("id")
    .single();
  if (error || !data) {
    redirect(`/obras?erro=${encodeURIComponent(mensagemErroBanco(error!))}`);
  }
  revalidatePath("/obras");
  redirect(`/obras/${data.id}`);
}

export async function salvarObra(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUsuario();
  const id = texto(formData, "id");
  if (!id) return { ok: false, error: "Registro inválido." };
  const status = texto(formData, "status");
  if (!VALORES_STATUS_OBRA.includes(status)) {
    return { ok: false, error: "Status inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("obras")
    .update({
      status,
      previsao_inicio: textoOuNulo(formData, "previsao_inicio"),
      previsao_fim: textoOuNulo(formData, "previsao_fim"),
      outros_custos: round2(dec(formData.get("outros_custos"))),
      observacoes: textoOuNulo(formData, "observacoes"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: mensagemErroBanco(error) };

  revalidatePath(`/obras/${id}`);
  revalidatePath("/obras");
  return { ok: true, error: null, mensagem: "Obra salva." };
}

export async function salvarApartamentosObra(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUsuario();
  const id = texto(formData, "id");
  if (!id) return { ok: false, error: "Registro inválido." };

  let linhas: unknown;
  try {
    linhas = JSON.parse(texto(formData, "linhas"));
  } catch {
    return { ok: false, error: "Não foi possível ler os apartamentos." };
  }
  if (!Array.isArray(linhas)) return { ok: false, error: "Formato inválido." };

  const registros = (linhas as Record<string, unknown>[])
    .map((l, i) => ({
      obra_id: id,
      identificacao: String(l.identificacao ?? "").trim(),
      status: ["pendente", "agendado", "concluido", "impedido"].includes(
        String(l.status),
      )
        ? String(l.status)
        : "pendente",
      data_conclusao: l.data_conclusao ? String(l.data_conclusao) : null,
      observacao: l.observacao ? String(l.observacao) : null,
      ordem: i,
    }))
    .filter((r) => r.identificacao !== "");

  const supabase = await createClient();
  await supabase.from("obra_apartamentos").delete().eq("obra_id", id);
  if (registros.length > 0) {
    const { error } = await supabase.from("obra_apartamentos").insert(registros);
    if (error) return { ok: false, error: mensagemErroBanco(error) };
  }

  revalidatePath(`/obras/${id}`);
  return {
    ok: true,
    error: null,
    mensagem: `${registros.length} apartamento(s) salvo(s).`,
  };
}

export async function salvarRequisicao(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const usuario = await requireUsuario();
  const obra_id = texto(formData, "obra_id");
  if (!obra_id) return { ok: false, error: "Obra inválida." };

  let materiaisRaw: unknown;
  try {
    materiaisRaw = JSON.parse(texto(formData, "materiais"));
  } catch {
    return { ok: false, error: "Não foi possível ler os materiais." };
  }
  const materiais = (Array.isArray(materiaisRaw) ? materiaisRaw : [])
    .map((m, i) => {
      const x = m as Record<string, unknown>;
      const quantidade = dec(x.quantidade as string) || 0;
      const valor_unitario = round2(dec(x.valor_unitario as string));
      return {
        descricao: String(x.descricao ?? "").trim(),
        quantidade,
        unidade: x.unidade ? String(x.unidade) : null,
        valor_unitario,
        valor_total: round2(quantidade * valor_unitario),
        ordem: i,
      };
    })
    .filter((m) => m.descricao !== "");

  if (materiais.length === 0) {
    return { ok: false, error: "Adicione ao menos um material." };
  }
  const valorTotal = round2(
    materiais.reduce((a, m) => a + m.valor_total, 0),
  );

  const supabase = await createClient();

  // upload do PDF (opcional)
  let anexo_path: string | null = null;
  const arquivo = formData.get("arquivo");
  if (arquivo instanceof File && arquivo.size > 0) {
    const path = `${obra_id}/${randomUUID()}.pdf`;
    const { error: upErr } = await supabase.storage
      .from("requisicoes")
      .upload(path, arquivo, {
        contentType: arquivo.type || "application/pdf",
        upsert: false,
      });
    if (upErr) return { ok: false, error: `Falha no anexo: ${upErr.message}` };
    anexo_path = path;
  }

  const { data: req, error } = await supabase
    .from("obra_requisicoes")
    .insert({
      obra_id,
      numero: textoOuNulo(formData, "numero"),
      data: textoOuNulo(formData, "data"),
      anexo_path,
      valor_total: valorTotal,
      criado_por: usuario.id,
    })
    .select("id")
    .single();
  if (error || !req) return { ok: false, error: mensagemErroBanco(error!) };

  const { error: matErr } = await supabase
    .from("obra_materiais")
    .insert(materiais.map((m) => ({ ...m, requisicao_id: req.id })));
  if (matErr) return { ok: false, error: mensagemErroBanco(matErr) };

  revalidatePath(`/obras/${obra_id}`);
  revalidatePath("/obras");
  return { ok: true, error: null, mensagem: "Requisição salva." };
}

export async function excluirRequisicao(formData: FormData): Promise<void> {
  await requireUsuario();
  const id = texto(formData, "id");
  const obra_id = texto(formData, "obra_id");
  if (!id) return;
  const supabase = await createClient();
  const { data: req } = await supabase
    .from("obra_requisicoes")
    .select("anexo_path")
    .eq("id", id)
    .maybeSingle();
  await supabase.from("obra_requisicoes").delete().eq("id", id);
  if (req?.anexo_path) {
    await supabase.storage.from("requisicoes").remove([req.anexo_path]);
  }
  revalidatePath(`/obras/${obra_id}`);
  revalidatePath("/obras");
}
