import { round2 } from "@/lib/orcamento-calc";

/** Percentual de entrada nas formas parceladas (ver PDFs de referência). */
export const PERCENTUAL_ENTRADA = 0.1;

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Texto da "Forma de pagamento" na tabela de investimento do PDF.
 *  - à vista (1 parcela): "À vista"
 *  - parcelado: "Entrada de R$ X e saldo em Nx de R$ Y"
 *    onde X = 10% do valor por apartamento e Y = (valor - X) / N.
 */
export function textoParcelamento(
  valorPorApartamento: number,
  numParcelas: number,
): string {
  if (numParcelas <= 1) return "À vista";
  const entrada = round2(valorPorApartamento * PERCENTUAL_ENTRADA);
  const parcela = round2((valorPorApartamento - entrada) / numParcelas);
  return `Entrada de ${brl(entrada)} e saldo em ${numParcelas}x de ${brl(parcela)}`;
}
