import { requireUsuario } from "@/lib/auth";
import { respostaCsv } from "@/lib/csv";
import {
  calcularFinanceiroObra,
  formatPct,
} from "@/lib/obras-financeiro";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireUsuario();
  const { id } = await params;
  const supabase = await createClient();

  const { data: obra } = await supabase
    .from("obras")
    .select(
      "id, status, outros_custos, condominios(nome), orcamentos(numero, valor_total)",
    )
    .eq("id", id)
    .single();
  if (!obra) return new Response("Obra não encontrada", { status: 404 });

  const cond = obra.condominios as unknown as { nome: string } | null;
  const orc = obra.orcamentos as unknown as {
    numero: string;
    valor_total: number | null;
  } | null;

  const [{ data: reqs }, { data: deducoes }] = await Promise.all([
    supabase
      .from("obra_requisicoes")
      .select("id, numero, data, valor_total")
      .eq("obra_id", id)
      .order("data", { ascending: true, nullsFirst: true }),
    supabase
      .from("obra_deducoes")
      .select("descricao, valor")
      .eq("obra_id", id)
      .order("ordem"),
  ]);

  const listaReqs = reqs ?? [];
  const reqIds = listaReqs.map((r) => r.id);
  const { data: mats } = reqIds.length
    ? await supabase
        .from("obra_materiais")
        .select(
          "requisicao_id, descricao, quantidade, unidade, valor_unitario, valor_total, ordem",
        )
        .in("requisicao_id", reqIds)
        .order("ordem")
    : { data: [] };

  const numeroPorReq = new Map(
    listaReqs.map((r) => [r.id, r.numero ?? ""] as const),
  );
  const dataPorReq = new Map(
    listaReqs.map((r) => [r.id, r.data ?? ""] as const),
  );

  const fin = calcularFinanceiroObra({
    receitaBruta: orc?.valor_total ?? null,
    deducoes: (deducoes ?? []).reduce((a, d) => a + (d.valor ?? 0), 0),
    materiais: listaReqs.reduce((a, r) => a + (r.valor_total ?? 0), 0),
    outrosCustos: obra.outros_custos ?? 0,
  });

  const linhas: unknown[][] = [
    ["Obra", cond?.nome ?? ""],
    ["Orçamento", orc?.numero ?? ""],
    ["Status", obra.status],
    [],
    ["Receita bruta (valor aprovado)", fin.receitaBruta],
    ["(-) Impostos e retenções", fin.deducoes],
    ["= Receita líquida", fin.receitaLiquida],
    ["(-) Materiais", fin.materiais],
    ["(-) Outros custos", fin.outrosCustos],
    ["= Resultado", fin.resultado],
    ["Margem sobre a receita bruta", formatPct(fin.margem)],
    [],
  ];

  if ((deducoes ?? []).length) {
    linhas.push(["Deduções", "Valor"]);
    for (const d of deducoes ?? []) linhas.push([d.descricao, d.valor ?? 0]);
    linhas.push([]);
  }

  linhas.push([
    "Requisição",
    "Data",
    "Descrição",
    "Qtd",
    "Unidade",
    "Valor unit.",
    "Valor total",
  ]);
  for (const m of mats ?? []) {
    linhas.push([
      numeroPorReq.get(m.requisicao_id) ?? "",
      dataPorReq.get(m.requisicao_id) ?? "",
      m.descricao,
      m.quantidade,
      m.unidade ?? "",
      m.valor_unitario,
      m.valor_total,
    ]);
  }

  const slug = (cond?.nome ?? "obra")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();

  return respostaCsv(`obra-${slug}.csv`, ["Hydrojexe — Obra"], linhas);
}
