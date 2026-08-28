import type { SupabaseClient } from "@supabase/supabase-js";

import type { Json } from "@/types/database";

export type AcaoHistorico = "criar" | "atualizar" | "excluir";

export type EntradaHistorico = {
  orcamento_id: string;
  entidade: string;
  entidade_id?: string | null;
  acao: AcaoHistorico;
  campo?: string | null;
  valor_antes?: Json;
  valor_depois?: Json;
  descricao: string;
  alterado_por: string;
};

/** Grava uma linha em historico_alteracoes. Nunca lança (log é acessório). */
export async function registrarHistorico(
  supabase: SupabaseClient,
  entrada: EntradaHistorico,
): Promise<void> {
  try {
    await supabase.from("historico_alteracoes").insert({
      orcamento_id: entrada.orcamento_id,
      entidade: entrada.entidade,
      entidade_id: entrada.entidade_id ?? null,
      acao: entrada.acao,
      campo: entrada.campo ?? null,
      valor_antes: entrada.valor_antes ?? null,
      valor_depois: entrada.valor_depois ?? null,
      descricao: entrada.descricao,
      alterado_por: entrada.alterado_por,
    });
  } catch {
    // silencioso
  }
}

/**
 * Compara dois objetos e retorna só os campos que mudaram,
 * com { antes, depois } por campo.
 */
export function diffCampos<T extends Record<string, Json>>(
  antes: T,
  depois: T,
): { campos: string[]; antes: Record<string, Json>; depois: Record<string, Json> } {
  const campos: string[] = [];
  const a: Record<string, Json> = {};
  const d: Record<string, Json> = {};
  for (const k of Object.keys(depois)) {
    const va = antes[k] ?? null;
    const vd = depois[k] ?? null;
    if (JSON.stringify(va) !== JSON.stringify(vd)) {
      campos.push(k);
      a[k] = va;
      d[k] = vd;
    }
  }
  return { campos, antes: a, depois: d };
}
