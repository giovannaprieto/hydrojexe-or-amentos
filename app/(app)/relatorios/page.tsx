import { FunilComercial } from "@/components/funil-comercial";
import {
  RelatoriosFiltros,
  type FiltrosRelatorio,
} from "@/components/relatorios-filtros";
import {
  Card,
  EmptyRow,
  PageHeader,
  TableWrap,
} from "@/components/ui-layout";
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
}: {
  rotulo: string;
  valor: string;
  nota?: string;
}) {
  return (
    <div className="hj-card hj-card-pad flex flex-col gap-1">
      <p className="hj-label">{rotulo}</p>
      <p className="text-2xl font-semibold tracking-tight text-navy-900 tabular-nums">
        {valor}
      </p>
      {nota ? <p className="text-xs text-ink-500">{nota}</p> : null}
    </div>
  );
}

function ListaContagem({
  titulo,
  itens,
}: {
  titulo: string;
  itens: { rotulo: string; total: number }[];
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="hj-section-title">{titulo}</h2>
      <Card plano>
        <TableWrap>
          <tbody>
            {itens.slice(0, 8).map((it, i) => (
              <tr key={it.rotulo}>
                <td className="w-8 text-ink-400 tabular-nums">{i + 1}</td>
                <td className="font-medium text-navy-900">{it.rotulo}</td>
                <td className="text-right font-medium tabular-nums">
                  {it.total}
                </td>
              </tr>
            ))}
            {itens.length === 0 ? (
              <EmptyRow colSpan={3}>Sem dados no período.</EmptyRow>
            ) : null}
          </tbody>
        </TableWrap>
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
      "status, tipo_proposta, valor_total, criado_por, condominios(administradora), usuarios!criado_por(nome)",
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
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Relatório comercial"
        descricao="Calculado a partir dos orçamentos reais. Use os filtros para recortar o período/responsável/administradora."
      />

      <RelatoriosFiltros
        valores={filtros}
        usuarios={usuarios ?? []}
        administradoras={administradoras}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Indicador rotulo="Orçamentos" valor={String(r.total)} />
        <Indicador rotulo="Enviados" valor={String(r.enviados)} />
        <Indicador rotulo="Aprovados" valor={String(r.aprovados)} />
        <Indicador
          rotulo="Taxa de conversão"
          valor={conversao}
          nota="aprovados ÷ enviados"
        />
        <Indicador
          rotulo="Valor médio"
          valor={formatBRL(r.valorMedio)}
          nota="dos orçamentos filtrados"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Indicador rotulo="Rascunhos" valor={String(r.rascunhos)} />
        <Indicador rotulo="Recusados" valor={String(r.recusados)} />
        <Indicador rotulo="Cancelados" valor={String(r.cancelados)} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="hj-section-title">Funil comercial</h2>
        <FunilComercial etapas={r.funil} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <ListaContagem titulo="Serviços mais orçados" itens={r.servicos} />
        <ListaContagem
          titulo="Administradoras com mais oportunidades"
          itens={r.administradoras}
        />
        <ListaContagem titulo="Responsáveis" itens={r.responsaveis} />
      </div>
    </div>
  );
}
