import Link from "next/link";

import { criarObra } from "@/app/(app)/obras/actions";
import {
  Alert,
  Badge,
  Card,
  DataList,
  EmptyRow,
  PageHeader,
  TableWrap,
} from "@/components/ui-layout";
import { requireUsuario } from "@/lib/auth";
import { formatBRL } from "@/lib/format";
import { TOM_STATUS_OBRA, rotuloStatusObra } from "@/lib/obras";
import {
  calcularFinanceiroObra,
  formatPct,
  round2,
} from "@/lib/obras-financeiro";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Obras · Hydrojexe" };

export default async function ObrasPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  await requireUsuario();
  const { erro } = await searchParams;
  const supabase = await createClient();

  const [{ data: obras }, { data: condominios }] = await Promise.all([
    supabase
      .from("obras")
      .select(
        "id, status, outros_custos, condominio_id, orcamento_id, condominios(nome), orcamentos(valor_total)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("condominios")
      .select("id, nome")
      .is("arquivado_em", null)
      .order("nome"),
  ]);

  const lista = obras ?? [];
  const obraIds = lista.map((o) => o.id);

  const materiaisPorObra = new Map<string, number>();
  const deducoesPorObra = new Map<string, number>();
  if (obraIds.length) {
    const [{ data: reqs }, { data: deds }] = await Promise.all([
      supabase
        .from("obra_requisicoes")
        .select("obra_id, valor_total")
        .in("obra_id", obraIds),
      supabase
        .from("obra_deducoes")
        .select("obra_id, valor")
        .in("obra_id", obraIds),
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
    const orc = o.orcamentos as unknown as {
      valor_total: number | null;
    } | null;
    const fin = calcularFinanceiroObra({
      receitaBruta: orc?.valor_total ?? null,
      deducoes: deducoesPorObra.get(o.id) ?? 0,
      materiais: materiaisPorObra.get(o.id) ?? 0,
      outrosCustos: o.outros_custos ?? 0,
    });
    return { id: o.id, status: o.status, nome: cond?.nome ?? "—", fin };
  });

  const somaAtivas = linhas.filter(
    (l) => l.status !== "cancelada",
  );
  const total = {
    receitaBruta: round2(
      somaAtivas.reduce((a, l) => a + l.fin.receitaBruta, 0),
    ),
    deducoes: round2(somaAtivas.reduce((a, l) => a + l.fin.deducoes, 0)),
    materiais: round2(somaAtivas.reduce((a, l) => a + l.fin.materiais, 0)),
    outrosCustos: round2(
      somaAtivas.reduce((a, l) => a + l.fin.outrosCustos, 0),
    ),
    resultado: round2(somaAtivas.reduce((a, l) => a + l.fin.resultado, 0)),
  };
  const margemGlobal =
    total.receitaBruta > 0 ? total.resultado / total.receitaBruta : null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Obras"
        descricao="Instalação por condomínio — apartamentos, materiais e resultado financeiro."
        acoes={
          lista.length > 0 ? (
            // eslint-disable-next-line @next/next/no-html-link-for-pages -- route handler de download
            <a href="/obras/export" className="hj-btn hj-btn-secondary">
              Exportar Excel
            </a>
          ) : undefined
        }
      />

      {erro ? <Alert tom="error">{erro}</Alert> : null}

      {somaAtivas.length > 0 ? (
        <Card titulo="Consolidado (exceto obras canceladas)">
          <DataList
            colunas={4}
            itens={[
              { rotulo: "Receita bruta", valor: formatBRL(total.receitaBruta) },
              {
                rotulo: "Impostos e retenções",
                valor: formatBRL(total.deducoes),
              },
              { rotulo: "Materiais", valor: formatBRL(total.materiais) },
              {
                rotulo: "Outros custos",
                valor: formatBRL(total.outrosCustos),
              },
              {
                rotulo: "Resultado",
                valor: (
                  <span
                    className={
                      total.resultado >= 0
                        ? "text-emerald-700"
                        : "text-red-600"
                    }
                  >
                    {formatBRL(total.resultado)}
                  </span>
                ),
              },
              { rotulo: "Margem média", valor: formatPct(margemGlobal) },
            ]}
          />
        </Card>
      ) : null}

      <Card plano>
        <TableWrap>
          <thead>
            <tr>
              <th>Condomínio</th>
              <th>Status</th>
              <th className="text-right">Receita bruta</th>
              <th className="hidden text-right md:table-cell">Custo total</th>
              <th className="text-right">Resultado</th>
              <th className="hidden text-right sm:table-cell">Margem</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.id}>
                <td>
                  <Link
                    href={`/obras/${l.id}`}
                    className="font-medium text-navy-900 underline-offset-4 hover:text-brand-600 hover:underline"
                  >
                    {l.nome}
                  </Link>
                </td>
                <td>
                  <Badge tom={TOM_STATUS_OBRA[l.status] ?? "neutral"}>
                    {rotuloStatusObra(l.status)}
                  </Badge>
                </td>
                <td className="text-right tabular-nums text-ink-600">
                  {formatBRL(l.fin.receitaBruta)}
                </td>
                <td className="hidden text-right tabular-nums text-ink-600 md:table-cell">
                  {formatBRL(l.fin.custoTotal)}
                </td>
                <td
                  className={`text-right font-medium tabular-nums ${
                    l.fin.resultado >= 0
                      ? "text-emerald-700"
                      : "text-red-600"
                  }`}
                >
                  {formatBRL(l.fin.resultado)}
                </td>
                <td className="hidden text-right tabular-nums text-ink-500 sm:table-cell">
                  {formatPct(l.fin.margem)}
                </td>
              </tr>
            ))}
            {linhas.length === 0 ? (
              <EmptyRow colSpan={6}>Nenhuma obra registrada.</EmptyRow>
            ) : null}
          </tbody>
        </TableWrap>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="hj-section-title">Nova obra</h2>
        <Card>
          <form action={criarObra} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="hj-field-label">Condomínio</span>
              <select
                name="condominio_id"
                required
                defaultValue=""
                className="hj-control w-64"
              >
                <option value="" disabled>
                  Selecione…
                </option>
                {(condominios ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="hj-btn hj-btn-primary">
              Criar obra
            </button>
          </form>
        </Card>
      </section>
    </div>
  );
}
