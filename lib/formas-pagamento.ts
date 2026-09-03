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
 * Parcelamento especial (por condomínio): cada faixa usa o preço de uma faixa
 * abaixo. À vista e 6x nunca mudam.
 *
 *   padrao : 9x  -> preço de 6x,  12x -> preço de 9x   (24x já usa 12x)
 *   longo  : 12x -> preço de 6x,  24x -> preço de 9x,   36x -> preço de 12x
 */
export type ModoParcelamentoEspecial = "nenhum" | "padrao" | "longo";

const SHIFT_PARCELAMENTO: Record<
  ModoParcelamentoEspecial,
  Record<number, number>
> = {
  nenhum: {},
  padrao: { 9: 6, 12: 9 },
  longo: { 12: 6, 24: 9, 36: 12 },
};

/** Nº de parcelas cuja COLUNA DE PREÇO deve ser usada para `numParcelas`. */
export function parcelasOrigemPreco(
  numParcelas: number,
  modo: ModoParcelamentoEspecial,
): number {
  return SHIFT_PARCELAMENTO[modo]?.[numParcelas] ?? numParcelas;
}

/** Deriva o modo efetivo a partir das colunas do condomínio. */
export function modoParcelamento(
  cond:
    | {
        parcelamento_especial?: boolean | null;
        parcelamento_especial_modo?: string | null;
      }
    | null
    | undefined,
): ModoParcelamentoEspecial {
  if (!cond?.parcelamento_especial) return "nenhum";
  return cond.parcelamento_especial_modo === "longo" ? "longo" : "padrao";
}

export const MODOS_PARCELAMENTO_ESPECIAL = [
  {
    valor: "nenhum",
    rotulo: "Nenhum",
  },
  {
    valor: "padrao",
    rotulo: "Padrão — 9x usa o preço de 6x, 12x usa o de 9x",
  },
  {
    valor: "longo",
    rotulo: "Longo — 12x usa o de 6x, 24x usa o de 9x, 36x usa o de 12x",
  },
] as const;

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
