import Link from "next/link";

import { criarObra } from "@/app/(app)/obras/actions";
import {
  Alert,
  Badge,
  Card,
  EmptyRow,
  PageHeader,
  TableWrap,
} from "@/components/ui-layout";
import { requireUsuario } from "@/lib/auth";
import { formatBRL, formatDateBR } from "@/lib/format";
import { TOM_STATUS_OBRA, rotuloStatusObra } from "@/lib/obras";
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
        "id, status, previsao_inicio, previsao_fim, outros_custos, condominio_id, orcamento_id, condominios(nome)",
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
  const orcIds = lista
    .map((o) => o.orcamento_id)
    .filter((x): x is string => !!x);

  const custoPorObra = new Map<string, number>();
  if (obraIds.length) {
    const { data: reqs } = await supabase
      .from("obra_requisicoes")
      .select("obra_id, valor_total")
      .in("obra_id", obraIds);
    for (const r of reqs ?? [])
      custoPorObra.set(
        r.obra_id,
        (custoPorObra.get(r.obra_id) ?? 0) + (r.valor_total ?? 0),
      );
  }
  const aprovadoPorOrc = new Map<string, number>();
  if (orcIds.length) {
    const { data: orcs } = await supabase
      .from("orcamentos")
      .select("id, valor_total")
      .in("id", orcIds);
    for (const o of orcs ?? [])
      aprovadoPorOrc.set(o.id, o.valor_total ?? 0);
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Obras"
        descricao="Instalação por condomínio — checklist de apartamentos e custo de materiais."
      />

      {erro ? <Alert tom="error">{erro}</Alert> : null}

      <Card plano>
        <TableWrap>
          <thead>
            <tr>
              <th>Condomínio</th>
              <th>Status</th>
              <th className="hidden md:table-cell">Previsão</th>
              <th className="text-right">Custo</th>
              <th className="hidden sm:table-cell text-right">Aprovado</th>
              <th className="text-right">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((o) => {
              const cond = o.condominios as unknown as {
                nome: string;
              } | null;
              const custo =
                (custoPorObra.get(o.id) ?? 0) + (o.outros_custos ?? 0);
              const aprovado = o.orcamento_id
                ? (aprovadoPorOrc.get(o.orcamento_id) ?? null)
                : null;
              const resultado = aprovado != null ? aprovado - custo : null;
              return (
                <tr key={o.id}>
                  <td>
                    <Link
                      href={`/obras/${o.id}`}
                      className="font-medium text-navy-900 underline-offset-4 hover:text-brand-600 hover:underline"
                    >
                      {cond?.nome ?? "—"}
                    </Link>
                  </td>
                  <td>
                    <Badge tom={TOM_STATUS_OBRA[o.status] ?? "neutral"}>
                      {rotuloStatusObra(o.status)}
                    </Badge>
                  </td>
                  <td className="hidden text-ink-600 md:table-cell">
                    {[o.previsao_inicio, o.previsao_fim]
                      .filter(Boolean)
                      .map((d) => formatDateBR(d as string))
                      .join(" → ") || "—"}
                  </td>
                  <td className="text-right font-medium tabular-nums">
                    {formatBRL(custo)}
                  </td>
                  <td className="hidden text-right tabular-nums text-ink-600 sm:table-cell">
                    {aprovado != null ? formatBRL(aprovado) : "—"}
                  </td>
                  <td
                    className={`text-right font-medium tabular-nums ${
                      resultado == null
                        ? "text-ink-400"
                        : resultado >= 0
                          ? "text-emerald-700"
                          : "text-red-600"
                    }`}
                  >
                    {resultado != null ? formatBRL(resultado) : "—"}
                  </td>
                </tr>
              );
            })}
            {lista.length === 0 ? (
              <EmptyRow colSpan={6}>Nenhuma obra registrada.</EmptyRow>
            ) : null}
          </tbody>
        </TableWrap>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="hj-section-title">Nova obra</h2>
        <Card>
          <form
            action={criarObra}
            className="flex flex-wrap items-end gap-3"
          >
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
