import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve a forma de pagamento usada para BUSCAR preço.
 * Ex.: 24x tem usa_preco_de_forma_id = <id do 12x> -> retorna o id do 12x.
 */
export async function resolverFormaPreco(
  supabase: SupabaseClient,
  formaId: string,
): Promise<string> {
  const { data } = await supabase
    .from("formas_pagamento")
    .select("id, usa_preco_de_forma_id")
    .eq("id", formaId)
    .single();
  return data?.usa_preco_de_forma_id ?? formaId;
}

export type PrecoUnit = { valor: number; preco_id: string | null };

/**
 * Preço a aplicar por item, para (itens × forma), na data de referência.
 * Regra: preço cuja vigência contém `dataRef`; se não houver (ex.: orçamento
 * datado antes da 1ª tabela cadastrada), usa a tabela mais recente daquele item.
 */
export async function precosVigentes(
  supabase: SupabaseClient,
  formaPrecoId: string,
  itemIds: string[],
  dataRef: string,
): Promise<Map<string, PrecoUnit>> {
  const map = new Map<string, PrecoUnit>();
  if (itemIds.length === 0) return map;

  const { data } = await supabase
    .from("precos")
    .select("id, item_id, valor, vigencia_inicio, vigencia_fim")
    .eq("forma_pagamento_id", formaPrecoId)
    .in("item_id", itemIds)
    .order("vigencia_inicio", { ascending: false });

  const maisRecente = new Map<string, PrecoUnit>();
  for (const p of data ?? []) {
    const contemData =
      p.vigencia_inicio <= dataRef &&
      (p.vigencia_fim == null || p.vigencia_fim > dataRef);
    if (contemData && !map.has(p.item_id)) {
      map.set(p.item_id, { valor: Number(p.valor), preco_id: p.id });
    }
    if (!maisRecente.has(p.item_id)) {
      maisRecente.set(p.item_id, { valor: Number(p.valor), preco_id: p.id });
    }
  }
  for (const [itemId, preco] of maisRecente) {
    if (!map.has(itemId)) map.set(itemId, preco);
  }
  return map;
}

/**
 * Preços já CONGELADOS neste orçamento, agrupados por forma de pagamento.
 * chave externa = forma_pagamento_id; interna = item_id.
 */
export async function precosCongeladosPorForma(
  supabase: SupabaseClient,
  orcamentoId: string,
): Promise<Map<string, Map<string, PrecoUnit>>> {
  const out = new Map<string, Map<string, PrecoUnit>>();
  const { data } = await supabase
    .from("orcamento_valores_congelados")
    .select("item_id, forma_pagamento_id, valor_unitario, preco_id")
    .eq("orcamento_id", orcamentoId);
  for (const c of data ?? []) {
    if (!out.has(c.forma_pagamento_id)) out.set(c.forma_pagamento_id, new Map());
    out.get(c.forma_pagamento_id)!.set(c.item_id, {
      valor: Number(c.valor_unitario),
      preco_id: c.preco_id,
    });
  }
  return out;
}
