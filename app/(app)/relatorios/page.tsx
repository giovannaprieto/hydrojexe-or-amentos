import { FunilComercial } from "@/components/funil-comercial";
import { GraficoMeses } from "@/components/grafico-meses";
import {
  RelatoriosFiltros,
  type FiltrosRelatorio,
} from "@/components/relatorios-filtros";
import { Card, EstadoVazio, PageHeader } from "@/components/ui-layout";
import { requireUsuario } from "@/lib/auth";
import { formatBRL } from "@/lib/format";
import { resumirRelatorio, type OrcamentoRelatorio } from "@/lib/relatorios";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Relatórios · Hydrojexe" };

function texto(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : (v ?? "")).trim();
}

function Indicador({
  rotulo,
  valor,
  nota,
  destaque,
}: {
  rotulo: string;
  valor: string;
  nota?: string;
  destaque?: boolean;
}) {
  return (
    <div className="hj-card hj-card-pad flex flex-col gap-1">
      <p className="hj-label">{rotulo}</p>
      <p
        className={`tabular-nums ${destaque ? "hj-stat" : "text-xl font-semibold tracking-tight text-navy-900"}`}
      >
        {valor}
      </p>
      {nota ? <p className="text-xs text-ink-500">{nota}</p> : null}
    </div>
  );
}

function Ranking({
  titulo,
  itens,
}: {
  titulo: string;
  itens: { rotulo: string; total: number }[];
}) {
  const max = Math.max(1, ...itens.map((i) => i.total));
  return (
    <section className="flex flex-col gap-3">
      <h2 className="hj-section-title">{titulo}</h2>
      <Card>
        {itens.length === 0 ? (
          <p className="text-sm text-ink-400">Sem dados no período.</p>
        ) : (
          <ol className="flex flex-col gap-2.5">
            {itens.slice(0, 8).map((it, i) => (
              <li key={it.rotulo} className="flex items-center gap-3 text-sm">
                <span className="w-4 shrink-0 text-ink-400 tabular-nums">
                  {i + 1}
                </span>
                <span className="w-40 shrink-0 truncate font-medium text-navy-900">
                  {it.rotulo}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                  <span
                    className="block h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.round((it.total / max) * 100)}%` }}
                  />
                </span>
                <span className="w-8 shrink-0 text-right font-semibold tabular-nums">
                  {it.total}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </section>
  );
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUsuario();
  const sp = await searchParams;
  const filtros: FiltrosRelatorio = {
    de: texto(sp.de),
    ate: texto(sp.ate),
    responsavel: texto(sp.responsavel),
    administradora: texto(sp.administradora),
    tipo: texto(sp.tipo),
    status: texto(sp.status),
  };

  const supabase = await createClient();

  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nome")
    .order("nome");

  const { data: adminsRaw } = await supabase
    .from("condominios")
    .select("administradora")
    .not("administradora", "is", null);
  const administradoras = [
    ...new Set((adminsRaw ?? []).map((c) => c.administradora as string)),
  ].sort();

  let condominioIds: string[] | null = null;
  if (filtros.administradora) {
    const { data } = await supabase
      .from("condominios")
      .select("id")
      .ilike("administradora", `%${filtros.administradora}%`);
    condominioIds = (data ?? []).map((c) => c.id);
  }

  let query = supabase
    .from("orcamentos")
    .select(
      "status, tipo_proposta, valor_total, data_orcamento, criado_por, condominios(administradora), usuarios!criado_por(nome)",
    );
  if (filtros.de) query = query.gte("data_orcamento", filtros.de);
  if (filtros.ate) query = query.lte("data_orcamento", filtros.ate);
  if (filtros.responsavel) query = query.eq("criado_por", filtros.responsavel);
  if (filtros.tipo) query = query.eq("tipo_proposta", filtros.tipo);
  if (filtros.status) query = query.eq("status", filtros.status);
  if (condominioIds) {
    query = query.in(
      "condominio_id",
      condominioIds.length
        ? condominioIds
        : ["00000000-0000-0000-0000-000000000000"],
    );
  }

  const { data: raw } = await query;
  const linhas: OrcamentoRelatorio[] = (raw ?? []).map((o) => ({
    status: o.status,
    tipo_proposta: o.tipo_proposta,
    valor_total: o.valor_total,
    data: o.data_orcamento,
    administradora:
      (o.condominios as { administradora: string | null } | null)
        ?.administradora ?? null,
    responsavel: (o.usuarios as { nome: string } | null)?.nome ?? null,
  }));

  const r = resumirRelatorio(linhas);
  const conversao =
    r.taxaConversao != null
      ? `${(r.taxaConversao * 100).toLocaleString("pt-BR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}%`
      : "—";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Relatório comercial"
        descricao="Calculado a partir dos orçamentos reais. Filtre por período, responsável, administradora, tipo ou status."
      />

      <RelatoriosFiltros
        valores={filtros}
        usuarios={usuarios ?? []}
        administradoras={administradoras}
      />

      {r.total === 0 ? (
        <EstadoVazio
          titulo="Nenhum orçamento nos filtros atuais"
          descricao="Ajuste o período ou limpe os filtros para ver os números."
        />
      ) : (
        <>
          {/* Volume ------------------------------------------------------- */}
          <section className="flex flex-col gap-3">
            <h2 className="hj-section-title">Volume</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Indicador
                rotulo="Orçamentos"
                valor={String(r.total)}
                destaque
                nota={`${r.rascunhos} rascunho(s)`}
              />
              <Indicador rotulo="Enviados" valor={String(r.enviados)} destaque />
              <Indicador
                rotulo="Aprovados"
                valor={String(r.aprovados)}
                destaque
              />
              <Indicador
                rotulo="Valor médio"
                valor={formatBRL(r.valorMedio)}
                nota="por orçamento"
                destaque
              />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="hj-section-title">Últimos 6 meses</h2>
            <GraficoMeses dados={r.porMes} />
          </section>

          {/* Conversão -------------------------------------------------- */}
          <section className="flex flex-col gap-3">
            <h2 className="hj-section-title">Conversão</h2>
            <div className="grid gap-4 lg:grid-cols-3">
              <Indicador
                rotulo="Taxa de conversão"
                valor={conversao}
                nota="aprovados ÷ enviados"
                destaque
              />
              <Indicador rotulo="Recusados" valor={String(r.recusados)} />
              <Indicador rotulo="Cancelados" valor={String(r.cancelados)} />
            </div>
            <FunilComercial etapas={r.funil} />
          </section>

          {/* Ranking --------------------------------------------------- */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Ranking titulo="Serviços mais orçados" itens={r.servicos} />
            <Ranking
              titulo="Administradoras com mais oportunidades"
              itens={r.administradoras}
            />
            <Ranking titulo="Responsáveis" itens={r.responsaveis} />
          </div>
        </>
      )}
    </div>
  );
}
