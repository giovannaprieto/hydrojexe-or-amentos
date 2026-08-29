import { rotuloTipoProposta } from "@/lib/orcamento-tipos";

export type OrcamentoRelatorio = {
  status: string;
  tipo_proposta: string;
  valor_total: number | null;
  administradora: string | null;
  responsavel: string | null;
  data: string | null;
};

export type ContagemItem = { rotulo: string; total: number };

export type ResumoRelatorio = {
  total: number;
  porStatus: Record<string, number>;
  enviados: number;
  aprovados: number;
  recusados: number;
  cancelados: number;
  rascunhos: number;
  /** aprovados / enviados; null quando não há enviados */
  taxaConversao: number | null;
  valorMedio: number;
  servicos: ContagemItem[];
  administradoras: ContagemItem[];
  responsaveis: ContagemItem[];
  funil: { rotulo: string; total: number }[];
  /** série dos últimos 6 meses: criados x aprovados */
  porMes: { rotulo: string; criados: number; aprovados: number }[];
};

const MESES_ABREV = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function seriePorMes(
  linhas: OrcamentoRelatorio[],
): { rotulo: string; criados: number; aprovados: number }[] {
  const hoje = new Date();
  hoje.setDate(1);
  const meses: { chave: string; rotulo: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const m = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.push({
      chave: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`,
      rotulo: MESES_ABREV[m.getMonth()],
    });
  }
  return meses.map((m) => {
    const doMes = linhas.filter((o) => (o.data ?? "").slice(0, 7) === m.chave);
    return {
      rotulo: m.rotulo,
      criados: doMes.length,
      aprovados: doMes.filter((o) => o.status === "aprovado").length,
    };
  });
}

function topContagem(
  linhas: OrcamentoRelatorio[],
  chave: (o: OrcamentoRelatorio) => string | null,
  rotulo: (k: string) => string = (k) => k,
): ContagemItem[] {
  const mapa = new Map<string, number>();
  for (const o of linhas) {
    const k = chave(o);
    if (!k) continue;
    mapa.set(k, (mapa.get(k) ?? 0) + 1);
  }
  return [...mapa.entries()]
    .map(([k, total]) => ({ rotulo: rotulo(k), total }))
    .sort((a, b) => b.total - a.total);
}

export function resumirRelatorio(
  linhas: OrcamentoRelatorio[],
): ResumoRelatorio {
  const porStatus: Record<string, number> = {};
  for (const o of linhas) {
    porStatus[o.status] = (porStatus[o.status] ?? 0) + 1;
  }

  const enviados = porStatus["enviado"] ?? 0;
  const aprovados = porStatus["aprovado"] ?? 0;
  const recusados = porStatus["recusado"] ?? 0;
  const cancelados = porStatus["cancelado"] ?? 0;
  const rascunhos = porStatus["rascunho"] ?? 0;

  const valores = linhas
    .map((o) => Number(o.valor_total) || 0)
    .filter((v) => v > 0);
  const valorMedio =
    valores.length > 0
      ? Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 100) /
        100
      : 0;

  return {
    total: linhas.length,
    porStatus,
    enviados,
    aprovados,
    recusados,
    cancelados,
    rascunhos,
    taxaConversao: enviados > 0 ? aprovados / enviados : null,
    valorMedio,
    servicos: topContagem(linhas, (o) => o.tipo_proposta, rotuloTipoProposta),
    administradoras: topContagem(linhas, (o) => o.administradora),
    responsaveis: topContagem(linhas, (o) => o.responsavel),
    funil: [
      { rotulo: "Criados", total: linhas.length },
      { rotulo: "Enviados", total: enviados },
      { rotulo: "Aprovados", total: aprovados },
    ],
    porMes: seriePorMes(linhas),
  };
}
