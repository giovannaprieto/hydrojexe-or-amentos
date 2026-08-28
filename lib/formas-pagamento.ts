/**
 * Formas de pagamento "base" que cada orçamento pode ligar/desligar no PDF.
 * Guardadas em `orcamentos.formas_pagamento_visiveis` como nº de parcelas.
 * Condições fora do padrão continuam em `orcamentos.parcelas_custom`.
 */
export const FORMAS_PAGAMENTO_BASE = [1, 6, 9, 12] as const;

export function rotuloFormaBase(numParcelas: number): string {
  return numParcelas <= 1 ? "À vista" : `${numParcelas}x`;
}

/**
 * Normaliza o valor vindo do banco / formulário para um subconjunto ordenado
 * das 4 base. Vazio (ou inválido) = TODAS as 4 — desmarcar todas não some com
 * o bloco de investimento; para esconder uma forma, deixe as outras marcadas.
 */
export function parseFormasVisiveis(raw: unknown): number[] {
  const base = FORMAS_PAGAMENTO_BASE as readonly number[];
  if (!Array.isArray(raw)) return [...base];
  const set = new Set(
    raw.map((n) => Math.trunc(Number(n))).filter((n) => base.includes(n)),
  );
  const escolhidas = base.filter((n) => set.has(n));
  return escolhidas.length > 0 ? escolhidas : [...base];
}

/**
 * Filtra opções que carregam `parcelas` pela seleção de formas visíveis.
 * "à vista" cobre parcelas <= 1.
 */
export function filtrarPorFormasVisiveis<T extends { parcelas: number }>(
  opcoes: T[],
  visiveis: number[],
): T[] {
  const querAVista = visiveis.some((n) => n <= 1);
  return opcoes.filter((o) =>
    o.parcelas <= 1 ? querAVista : visiveis.includes(o.parcelas),
  );
}
