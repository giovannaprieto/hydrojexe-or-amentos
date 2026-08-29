import Link from "next/link";
import { notFound } from "next/navigation";

import { excluirObra, excluirRequisicao } from "@/app/(app)/obras/actions";
import { IconTrash } from "@/components/icons";
import { ObraApartamentos } from "@/components/obra-apartamentos";
import { ObraDadosForm } from "@/components/obra-dados-form";
import { ObraDeducoes } from "@/components/obra-deducoes";
import { RequisicaoForm } from "@/components/requisicao-form";
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
import { calcularFinanceiroObra, formatPct } from "@/lib/obras-financeiro";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Obra · Hydrojexe" };

function LinhaDre({
  rotulo,
  valor,
  suave,
  sub,
  destaque,
  sinalCor,
}: {
  rotulo: string;
  valor: number;
  suave?: boolean;
  sub?: boolean;
  destaque?: boolean;
  sinalCor?: boolean;
}) {
  return (
    <div
      className={`flex justify-between py-1.5 ${
        sub || destaque ? "border-t border-ink-200 font-medium" : ""
      } ${destaque ? "text-base text-navy-900" : ""}`}
    >
      <dt className={suave ? "text-ink-500" : "text-navy-900"}>{rotulo}</dt>
      <dd
        className={`tabular-nums ${
          sinalCor
            ? valor >= 0
              ? "text-emerald-700"
              : "text-red-600"
            : suave
              ? "text-ink-500"
              : "text-navy-900"
        }`}
      >
        {formatBRL(valor)}
      </dd>
    </div>
  );
}

export default async function ObraPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  await requireUsuario();
  const { id } = await params;
  const { erro } = await searchParams;
  const supabase = await createClient();

  const { data: obra } = await supabase
    .from("obras")
    .select(
      "id, status, previsao_inicio, previsao_fim, outros_custos, observacoes, condominio_id, orcamento_id, condominios(nome), orcamentos(numero, valor_total)",
    )
    .eq("id", id)
    .single();
  if (!obra) notFound();

  const [{ data: aptos }, { data: reqs }, { data: deducoes }] =
    await Promise.all([
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
      supabase
        .from("obra_deducoes")
        .select("descricao, valor")
        .eq("obra_id", id)
        .order("ordem"),
    ]);

  const cond = obra.condominios as unknown as { nome: string } | null;
  const orc = obra.orcamentos as unknown as {
    numero: string;
    valor_total: number | null;
  } | null;

  const listaReqs = reqs ?? [];
  const listaDeducoes = deducoes ?? [];
  const custoMateriais = listaReqs.reduce(
    (a, r) => a + (r.valor_total ?? 0),
    0,
  );
  const fin = calcularFinanceiroObra({
    receitaBruta: orc?.valor_total ?? null,
    deducoes: listaDeducoes.reduce((a, d) => a + (d.valor ?? 0), 0),
    materiais: custoMateriais,
    outrosCustos: obra.outros_custos ?? 0,
  });

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
        acoes={
          <a href={`/obras/${obra.id}/export`} className="hj-btn hj-btn-secondary">
            Exportar Excel
          </a>
        }
      />

      {erro ? <Alert tom="error">{erro}</Alert> : null}

      <Card titulo="Resultado da obra">
        <dl className="flex flex-col text-sm">
          <LinhaDre rotulo="Receita bruta (valor aprovado)" valor={fin.receitaBruta} />
          <LinhaDre
            rotulo="(−) Impostos e retenções"
            valor={-fin.deducoes}
            suave
          />
          <LinhaDre rotulo="= Receita líquida" valor={fin.receitaLiquida} sub />
          <LinhaDre rotulo="(−) Materiais" valor={-fin.materiais} suave />
          <LinhaDre
            rotulo="(−) Outros custos (mão de obra etc.)"
            valor={-fin.outrosCustos}
            suave
          />
          <LinhaDre
            rotulo="= Resultado"
            valor={fin.resultado}
            destaque
            sinalCor
          />
          <div className="mt-2 flex justify-between border-t border-ink-200 pt-2 text-ink-500">
            <dt>Margem sobre a receita bruta</dt>
            <dd
              className={
                fin.margem == null
                  ? ""
                  : fin.resultado >= 0
                    ? "text-emerald-700"
                    : "text-red-600"
              }
            >
              {formatPct(fin.margem)}
            </dd>
          </div>
        </dl>
        {fin.receitaBruta === 0 ? (
          <p className="hj-hint mt-3">
            Sem orçamento aprovado vinculado — a receita está zerada. Vincule pelo
            condomínio ou aprove um orçamento.
          </p>
        ) : null}
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
        <h2 className="hj-section-title">Impostos e retenções</h2>
        <Card>
          <ObraDeducoes
            obraId={obra.id}
            inicial={listaDeducoes.map((d) => ({
              descricao: d.descricao,
              valor: String(d.valor ?? ""),
            }))}
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

      <section className="flex flex-wrap items-center gap-3 border-t border-ink-200 pt-6">
        <form action={excluirObra}>
          <input type="hidden" name="id" value={obra.id} />
          <button type="submit" className="hj-btn hj-btn-danger">
            <IconTrash />
            Excluir obra
          </button>
        </form>
        <span className="hj-hint">
          Apaga a obra, os apartamentos, as requisições e os PDFs anexados.
          Para pausar sem apagar, use o status “Pausada” ou “Cancelada”.
        </span>
      </section>
    </div>
  );
}
