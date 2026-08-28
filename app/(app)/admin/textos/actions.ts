"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import {
  mensagemErroBanco,
  texto,
  textoOuNulo,
  type FormState,
} from "@/lib/forms";
import {
  MODELOS_PROPOSTA_TIPOS,
  sanitizeSecoes,
} from "@/lib/modelos-proposta";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Textos do PDF "completo" (templates_texto — linha padrão)
// ---------------------------------------------------------------------------
export async function salvarTemplateTexto(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: padrao } = await supabase
    .from("templates_texto")
    .select("id")
    .eq("is_padrao", true)
    .maybeSingle();
  if (!padrao) {
    return { ok: false, error: "Template padrão não encontrado." };
  }

  const val = (c: string) => {
    const v = texto(formData, c);
    return v === "" ? null : v;
  };

  const { error } = await supabase
    .from("templates_texto")
    .update({
      sec_individualizacao_agua: val("sec_individualizacao_agua"),
      sec_analise_agua_preparado: val("sec_analise_agua_preparado"),
      sec_analise_agua_nao_preparado: val("sec_analise_agua_nao_preparado"),
      sec_objetivo: val("sec_objetivo"),
      sec_procedimento_tecnico: val("sec_procedimento_tecnico"),
      sec_intervencao: val("sec_intervencao"),
      sec_intervencao_agua_nao_preparado: val(
        "sec_intervencao_agua_nao_preparado",
      ),
      sec_tramites_administrativos: val("sec_tramites_administrativos"),
      sec_gerenciamento_mensal: val("sec_gerenciamento_mensal"),
      sec_garantia: val("sec_garantia"),
    })
    .eq("id", padrao.id);
  if (error) return { ok: false, error: mensagemErroBanco(error) };

  revalidatePath("/admin/textos");
  return { ok: true, error: null, mensagem: "Textos do orçamento completo salvos." };
}

// ---------------------------------------------------------------------------
// Textos-modelo das propostas não-completa (modelos_proposta)
// ---------------------------------------------------------------------------
export async function salvarModeloProposta(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();

  const tipo = texto(formData, "tipo");
  const meta = MODELOS_PROPOSTA_TIPOS.find((t) => t.tipo === tipo);
  if (!meta) return { ok: false, error: "Tipo de proposta inválido." };

  let secoes: { titulo: string; corpo: string }[];
  try {
    secoes = sanitizeSecoes(JSON.parse(texto(formData, "secoes")));
  } catch {
    return { ok: false, error: "Não foi possível ler as seções." };
  }

  // sem seções válidas -> volta ao texto padrão do sistema (remove o override)
  if (secoes.length === 0) {
    const { error } = await supabase
      .from("modelos_proposta")
      .delete()
      .eq("tipo", tipo);
    if (error) return { ok: false, error: mensagemErroBanco(error) };
    revalidatePath("/admin/textos");
    return {
      ok: true,
      error: null,
      mensagem: `“${meta.nome}” voltou a usar o texto padrão do sistema.`,
    };
  }

  if (secoes.some((s) => s.titulo.trim() === "")) {
    return { ok: false, error: "Toda seção precisa de um título." };
  }

  const { error } = await supabase.from("modelos_proposta").upsert(
    {
      tipo,
      nome: meta.nome,
      secoes,
      intro: textoOuNulo(formData, "intro"),
      ativo: true,
    },
    { onConflict: "tipo" },
  );
  if (error) return { ok: false, error: mensagemErroBanco(error) };

  revalidatePath("/admin/textos");
  return { ok: true, error: null, mensagem: `Textos de “${meta.nome}” salvos.` };
}
