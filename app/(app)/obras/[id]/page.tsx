import Link from "next/link";
import { notFound } from "next/navigation";

import { excluirRequisicao } from "@/app/(app)/obras/actions";
import { IconTrash } from "@/components/icons";
import { ObraApartamentos } from "@/components/obra-apartamentos";
import { ObraDadosForm } from "@/components/obra-dados-form";
import { RequisicaoForm } from "@/components/requisicao-form";
import {
  Badge,
  Card,
  DataList,
  EmptyRow,
  PageHeader,
  TableWrap,
} from "@/components/ui-layout";
import { requireUsuario } from "@/lib/auth";
import { formatBRL, formatDateBR } from "@/lib/format";
import { TOM_STATUS_OBRA, rotuloStatusObra } from "@/lib/obras";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Obra · Hydrojexe" };

export default async function ObraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUsuario();
  const { id } = await params;
  const supabase = await createClient();

  const { data: obra } = await supabase
    .from("obras")
    .select(
      "id, status, previsao_inicio, previsao_fim, outros_custos, observacoes, condominio_id, orcamento_id, condominios(nome), orcamentos(numero, valor_total)",
    )
    .eq("id", id)
    .single();
  if (!obra) notFound();

  const [{ data: aptos }, { data: reqs }] = await Promise.all([
    supabase
      .from("obra_apartamentos")
      .select("identificacao, status, data_conclusao, observacao")
      .eq("obra_id", id)
      .order("ordem"),
    supabase
      .from("obra_requisicoes")
      .select("id, numero, data, valor_total, anexo_path, created_at")
      .eq("obra_id", id)
      .order("data", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
  ]);

  const cond = obra.condominios as unknown as { nome: string } | null;
  const orc = obra.orcamentos as unknown as {
    numero: string;
    valor_total: number | null;
  } | null;

  const listaReqs = reqs ?? [];
  const custoMateriais = listaReqs.reduce(
    (a, r) => a + (r.valor_total ?? 0),
    0,
  );
  const custoTotal = custoMateriais + (obra.outros_custos ?? 0);
  const aprovado = orc?.valor_total ?? null;
  const resultado = aprovado != null ? aprovado - custoTotal : null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo={cond?.nome ?? "Obra"}
        voltar={{ href: "/obras", rotulo: "Obras" }}
        etiqueta={
          <Badge tom={TOM_STATUS_OBRA[obra.status] ?? "neutral"}>
            {rotuloStatusObra(obra.status)}
          </Badge>
        }
        descricao={
          <>
            <Link
              href={`/condominios/${obra.condominio_id}`}
              className="text-brand-600 hover:text-brand-700"
            >
              abrir condomínio
            </Link>
            {orc ? ` · orçamento ${orc.numero}` : ""}
          </>
        }
      />

      <Card titulo="Resumo de custos">
        <DataList
          colunas={4}
          itens={[
            { rotulo: "Materiais", valor: formatBRL(custoMateriais) },
            {
              rotulo: "Outros custos",
              valor: formatBRL(obra.outros_custos ?? 0),
            },
            { rotulo: "Custo total", valor: formatBRL(custoTotal) },
            {
              rotulo: "Resultado vs. aprovado",
              valor:
                resultado == null ? (
                  "—"
                ) : (
                  <span
                    className={
                      resultado >= 0 ? "text-emerald-700" : "text-red-600"
                    }
                  >
                    {formatBRL(resultado)}
                  </span>
                ),
            },
          ]}
        />
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="hj-section-title">Dados da obra</h2>
        <Card>
          <ObraDadosForm
            inicial={{
              id: obra.id,
              status: obra.status,
              previsao_inicio: obra.previsao_inicio,
              previsao_fim: obra.previsao_fim,
              outros_custos: obra.outros_custos ?? 0,
              observacoes: obra.observacoes,
            }}
          />
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="hj-section-title">Apartamentos</h2>
        <Card>
          <ObraApartamentos
            obraId={obra.id}
            inicial={(aptos ?? []).map((a) => ({
              identificacao: a.identificacao,
              status: a.status,
              data_conclusao: a.data_conclusao ?? "",
              observacao: a.observacao ?? "",
            }))}
          />
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="hj-section-title">Requisições de material</h2>
        <Card plano>
          <TableWrap>
            <thead>
              <tr>
                <th>Nº</th>
                <th>Data</th>
                <th className="text-right">Valor</th>
                <th>Anexo</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {listaReqs.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium text-navy-900">
                    {r.numero ?? "—"}
                  </td>
                  <td className="text-ink-600">
                    {r.data ? formatDateBR(r.data) : "—"}
                  </td>
                  <td className="text-right font-medium tabular-nums">
                    {formatBRL(r.valor_total)}
                  </td>
                  <td>
                    {r.anexo_path ? (
                      <a
                        href={`/obras/anexo/${r.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-600 hover:text-brand-700"
                      >
                        abrir PDF
                      </a>
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
                  </td>
                  <td className="text-right">
                    <form action={excluirRequisicao}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="obra_id" value={obra.id} />
                      <button
                        type="submit"
                        aria-label="Excluir requisição"
                        className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <IconTrash className="size-4" />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {listaReqs.length === 0 ? (
                <EmptyRow colSpan={5}>Nenhuma requisição lançada.</EmptyRow>
              ) : null}
            </tbody>
          </TableWrap>
        </Card>

        <details className="hj-card hj-card-pad">
          <summary className="cursor-pointer text-sm font-medium text-brand-600">
            + Nova requisição
          </summary>
          <div className="mt-4">
            <RequisicaoForm obraId={obra.id} />
          </div>
        </details>
      </section>
    </div>
  );
}
