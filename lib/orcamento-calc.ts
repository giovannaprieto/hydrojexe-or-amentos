/**
 * Cálculo de orçamento — função pura, usada tanto no preview (client) quanto
 * na gravação autoritativa (server action).
 *
 * Fórmula validada (prompt-sistema-hydrojexe_3.md):
 *   valor_por_apto = Σ(qtd_item × preço_unit_item)  +  (valor_TSS ÷ total_unidades)
 *   valor_total    = Σ_tipos (unidades × valor_por_apto)
 *
 * - preços já vêm resolvidos para a forma de pagamento do orçamento
 *   (24x já resolvido para 12x pelo chamador).
 * - itens marcados como TSS não entram na composição do apartamento
 *   (o TSS é rateado, não somado por ponto).
 */

export type ComposicaoItem = { item_id: string; quantidade: number };

export type TipoInput = {
  nome: string;
  unidades: number;
  itens: ComposicaoItem[];
};

export type CalcInput = {
  tipos: TipoInput[];
  /** item_id -> preço unitário (não-TSS), já na forma de pagamento do orçamento */
  precoUnit: Record<string, number>;
  /** se false, não há rateio de TSS (o condomínio não contratou) */
  incluirTss: boolean;
  /** preço unitário do item TSS, já na forma de pagamento do orçamento */
  tssValor: number;
  /** item_ids cuja unidade é "ponto" (contam como hidrômetro) */
  itensPonto: string[];
  /** item_ids marcados is_tss (ignorados na composição) */
  itensTss: string[];
  valorPorHidrometro: number;
  /** se preenchido, sobrescreve a contagem automática de hidrômetros */
  qtdHidrometrosOverride?: number | null;
};

export type TipoResultado = {
  nome: string;
  unidades: number;
  valorPorApartamento: number;
  subtotal: number;
};

export type CalcResultado = {
  totalUnidades: number;
  tssPorUnidade: number;
  tipos: TipoResultado[];
  valorTotal: number;
  qtdHidrometros: number;
  qtdHidrometrosAuto: number;
  valorTotalMensal: number;
};

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calcularOrcamento(input: CalcInput): CalcResultado {
  const pontos = new Set(input.itensPonto);
  const tss = new Set(input.itensTss);

  const totalUnidades = input.tipos.reduce(
    (acc, t) => acc + (Number(t.unidades) || 0),
    0,
  );

  const tssPorUnidade =
    input.incluirTss && totalUnidades > 0
      ? (input.tssValor || 0) / totalUnidades
      : 0;

  const tipos: TipoResultado[] = input.tipos.map((t) => {
    const unidades = Number(t.unidades) || 0;
    const somaItens = t.itens.reduce((acc, ci) => {
      if (tss.has(ci.item_id)) return acc;
      const preco = input.precoUnit[ci.item_id] ?? 0;
      return acc + (Number(ci.quantidade) || 0) * preco;
    }, 0);
    const valorPorApartamento = round2(somaItens + tssPorUnidade);
    return {
      nome: t.nome,
      unidades,
      valorPorApartamento,
      subtotal: round2(unidades * valorPorApartamento),
    };
  });

  const valorTotal = round2(
    tipos.reduce((acc, t) => acc + t.subtotal, 0),
  );

  const qtdHidrometrosAuto = input.tipos.reduce((acc, t) => {
    const unidades = Number(t.unidades) || 0;
    const pontosNoTipo = t.itens.reduce(
      (a, ci) =>
        pontos.has(ci.item_id) ? a + (Number(ci.quantidade) || 0) : a,
      0,
    );
    return acc + unidades * pontosNoTipo;
  }, 0);

  const qtdHidrometros =
    input.qtdHidrometrosOverride != null &&
    Number.isFinite(input.qtdHidrometrosOverride)
      ? Number(input.qtdHidrometrosOverride)
      : qtdHidrometrosAuto;

  const valorTotalMensal = round2(
    qtdHidrometros * (Number(input.valorPorHidrometro) || 0),
  );

  return {
    totalUnidades,
    tssPorUnidade,
    tipos,
    valorTotal,
    qtdHidrometros,
    qtdHidrometrosAuto,
    valorTotalMensal,
  };
}
