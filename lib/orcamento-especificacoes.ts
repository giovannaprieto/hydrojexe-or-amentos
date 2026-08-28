// Especificações técnicas que entram no texto do PDF conforme o item
// selecionado no orçamento. Usadas para substituir marcadores nos
// textos-modelo ({hidrometros}, {vazao_gas}).

/** bitola/spec do hidrômetro por slug do item "preparado". */
const HIDROMETRO_SPEC: Record<string, string> = {
  preparado_2_5m3: "de 2,5m³ com bitola de 1/2",
  preparado_1_5m3: "de 1,5m³ com bitola de 3/4",
  preparado_1_5m3_agua_quente: "de 1,5m³ para água quente com bitola de 3/4",
};

/**
 * Frase que substitui {hidrometros} na seção INTERVENÇÃO:
 *   "32 hidrômetros de 2,5m³ com bitola de 1/2"
 * A spec vem do primeiro item "preparado" presente na composição
 * (o sistema não mistura tipos de hidrômetro num mesmo orçamento).
 */
export function fraseHidrometros(
  qtd: number,
  slugsNaComposicao: Iterable<string>,
): string {
  let spec = "";
  for (const s of slugsNaComposicao) {
    if (HIDROMETRO_SPEC[s]) {
      spec = HIDROMETRO_SPEC[s];
      break;
    }
  }
  const nome = qtd === 1 ? "hidrômetro" : "hidrômetros";
  return spec ? `${qtd} ${nome} ${spec}` : `${qtd} ${nome}`;
}

/** Vazão nominal que substitui {vazao_gas} no PROCEDIMENTO EXECUTIVO. */
const VAZAO_GAS: Record<string, string> = {
  gas_1_6: "G 1.6 m³/h",
  gas_2_5: "G 2.6 m³/h",
};

export const MEDIDORES_GAS = [
  { valor: "gas_1_6", rotulo: "Gás 1.6 — vazão G 1.6 m³/h" },
  { valor: "gas_2_5", rotulo: "Gás 2.5 — vazão G 2.6 m³/h" },
] as const;

export function vazaoGas(slug: string | null | undefined): string {
  return (slug && VAZAO_GAS[slug]) || VAZAO_GAS.gas_1_6;
}
