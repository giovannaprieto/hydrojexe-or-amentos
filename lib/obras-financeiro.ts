export const round2 = (n: number) => Math.round(n * 100) / 100;

export type FinanceiroObra = {
  receitaBruta: number;
  deducoes: number;
  receitaLiquida: number;
  materiais: number;
  outrosCustos: number;
  custoTotal: number;
  resultado: number;
  /** resultado / receita bruta — null quando não há receita */
  margem: number | null;
};

/**
 * Cascata financeira de uma obra (DRE simplificada):
 *
 *   Receita bruta (valor aprovado do orçamento)
 *   − Impostos e retenções (deduções)          = Receita líquida
 *   − Custo de materiais (Σ requisições)
 *   − Outros custos (mão de obra etc.)          = Resultado da obra
 */
export function calcularFinanceiroObra(input: {
  receitaBruta: number | null;
  deducoes: number;
  materiais: number;
  outrosCustos: number;
}): FinanceiroObra {
  const receitaBruta = round2(input.receitaBruta ?? 0);
  const deducoes = round2(input.deducoes);
  const materiais = round2(input.materiais);
  const outrosCustos = round2(input.outrosCustos);
  const receitaLiquida = round2(receitaBruta - deducoes);
  const custoTotal = round2(materiais + outrosCustos);
  const resultado = round2(receitaLiquida - custoTotal);
  return {
    receitaBruta,
    deducoes,
    receitaLiquida,
    materiais,
    outrosCustos,
    custoTotal,
    resultado,
    margem: receitaBruta > 0 ? resultado / receitaBruta : null,
  };
}

export function formatPct(v: number | null): string {
  if (v == null) return "—";
  return `${(v * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}
