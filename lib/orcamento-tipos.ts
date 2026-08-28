export const TIPOS_PROPOSTA = [
  { valor: "completa", rotulo: "Individualização de água" },
  { valor: "gestao_mensal_agua", rotulo: "Gestão mensal — água" },
  { valor: "gestao_mensal_gas", rotulo: "Gestão mensal — gás" },
  { valor: "tss_light", rotulo: "TSS Light" },
  { valor: "individualizacao_gas", rotulo: "Individualização de gás" },
] as const;

export type TipoProposta = (typeof TIPOS_PROPOSTA)[number]["valor"];

export const VALORES_TIPO_PROPOSTA = TIPOS_PROPOSTA.map((t) => t.valor) as string[];

export function rotuloTipoProposta(tipo: string): string {
  return TIPOS_PROPOSTA.find((t) => t.valor === tipo)?.rotulo ?? tipo;
}
