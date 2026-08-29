import { requireUsuario } from "@/lib/auth";
import { respostaCsv } from "@/lib/csv";
import { calcularFinanceiroObra, formatPct } from "@/lib/obras-financeiro";
import { rotuloStatusObra } from "@/lib/obras";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUsuario();
  const supabase = await createClient();

  const { data: obras } = await supabase
    .from("obras")
    .select(
      "id, status, outros_custos, orcamento_id, condominios(nome), orcamentos(valor_total)",
    )
    .order("created_at", { ascending: false });

  const lista = obras ?? [];
  const ids = lista.map((o) => o.id);

  const materiaisPorObra = new Map<string, number>();
  const deducoesPorObra = new Map<string, number>();
  if (ids.length) {
    const [{ data: reqs }, { data: deds }] = await Promise.all([
      supabase
        .from("obra_requisicoes")
        .select("obra_id, valor_total")
        .in("obra_id", ids),
      supabase.from("obra_deducoes").select("obra_id, valor").in("obra_id", ids),
    ]);
    for (const r of reqs ?? [])
      materiaisPorObra.set(
        r.obra_id,
        (materiaisPorObra.get(r.obra_id) ?? 0) + (r.valor_total ?? 0),
      );
    for (const d of deds ?? [])
      deducoesPorObra.set(
        d.obra_id,
        (deducoesPorObra.get(d.obra_id) ?? 0) + (d.valor ?? 0),
      );
  }

  const linhas = lista.map((o) => {
    const cond = o.condominios as unknown as { nome: string } | null;
    const orc = o.orcamentos as unknown as { valor_total: number | null } | null;
    const fin = calcularFinanceiroObra({
      receitaBruta: orc?.valor_total ?? null,
      deducoes: deducoesPorObra.get(o.id) ?? 0,
      materiais: materiaisPorObra.get(o.id) ?? 0,
      outrosCustos: o.outros_custos ?? 0,
    });
    return [
      cond?.nome ?? "",
      rotuloStatusObra(o.status),
      fin.receitaBruta,
      fin.deducoes,
      fin.receitaLiquida,
      fin.materiais,
      fin.outrosCustos,
      fin.custoTotal,
      fin.resultado,
      formatPct(fin.margem),
    ];
  });

  return respostaCsv(
    "obras.csv",
    [
      "Condomínio",
      "Status",
      "Receita bruta",
      "Impostos e retenções",
      "Receita líquida",
      "Materiais",
      "Outros custos",
      "Custo total",
      "Resultado",
      "Margem %",
    ],
    linhas,
  );
}
