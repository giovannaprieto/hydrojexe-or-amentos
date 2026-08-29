import Link from "next/link";

import { IconPlus } from "@/components/icons";
import {
  OrcamentosFiltros,
  type FiltrosOrcamento,
} from "@/components/orcamentos-filtros";
import {
  Card,
  EmptyRow,
  LinkButton,
  PageHeader,
  StatusBadge,
  TableWrap,
} from "@/components/ui-layout";
import { requireUsuario } from "@/lib/auth";
import { formatBRL, formatDateBR } from "@/lib/format";
import { rotuloTipoProposta } from "@/lib/orcamento-tipos";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Orçamentos · Hydrojexe" };

function texto(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : (v ?? "")).trim();
}

export default async function OrcamentosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUsuario();
  const sp = await searchParams;
  const filtros: FiltrosOrcamento = {
    q: texto(sp.q),
    status: texto(sp.status),
    responsavel: texto(sp.responsavel),
    tipo: texto(sp.tipo),
    de: texto(sp.de),
    ate: texto(sp.ate),
  };

  const supabase = await createClient();

  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nome")
    .order("nome");

  // texto livre casa com nº do orçamento OU nome/cnpj/administradora do condomínio
  let condominioIds: string[] | null = null;
  if (filtros.q) {
    const termo = `%${filtros.q}%`;
    const { data: conds } = await supabase
      .from("condominios")
      .select("id")
      .or(
        `nome.ilike.${termo},cnpj.ilike.${termo},administradora.ilike.${termo}`,
      );
    condominioIds = (conds ?? []).map((c) => c.id);
  }

  let query = supabase
    .from("orcamentos")
    .select(
      "id, numero, data_orcamento, status, tipo_proposta, valor_total, criado_por, condominios(nome), usuarios!criado_por(nome)",
    )
    .order("data_orcamento", { ascending: false })
    .order("numero", { ascending: false });

  if (filtros.status) query = query.eq("status", filtros.status);
  if (filtros.tipo) query = query.eq("tipo_proposta", filtros.tipo);
  if (filtros.responsavel) query = query.eq("criado_por", filtros.responsavel);
  if (filtros.de) query = query.gte("data_orcamento", filtros.de);
  if (filtros.ate) query = query.lte("data_orcamento", filtros.ate);
  if (filtros.q) {
    const ids = (condominioIds ?? []).map((id) => `"${id}"`).join(",");
    const orExpr = ids
      ? `numero.ilike.%${filtros.q}%,condominio_id.in.(${ids})`
      : `numero.ilike.%${filtros.q}%`;
    query = query.or(orExpr);
  }

  const { data: orcamentos } = await query;
  const lista = orcamentos ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Orçamentos"
        descricao={`${lista.length} orçamento(s) encontrado(s).`}
        acoes={
          <LinkButton href="/orcamentos/novo" variante="primary">
            <IconPlus />
            Novo orçamento
          </LinkButton>
        }
      />

      <OrcamentosFiltros valores={filtros} usuarios={usuarios ?? []} />

      <Card plano>
        <TableWrap>
          <thead>
            <tr>
              <th>Número</th>
              <th>Condomínio</th>
              <th className="hidden md:table-cell">Tipo</th>
              <th className="hidden lg:table-cell">Responsável</th>
              <th>Status</th>
              <th className="text-right">Total à vista</th>
              <th className="hidden sm:table-cell">Data</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((o) => {
              const condominio = o.condominios as { nome: string } | null;
              const resp = o.usuarios as { nome: string } | null;
              return (
                <tr key={o.id}>
                  <td>
                    <Link
                      href={`/orcamentos/${o.id}`}
                      className="font-medium text-navy-900 underline-offset-4 hover:text-brand-600 hover:underline"
                    >
                      {o.numero}
                    </Link>
                  </td>
                  <td>{condominio?.nome ?? "—"}</td>
                  <td className="hidden text-ink-600 md:table-cell">
                    {rotuloTipoProposta(o.tipo_proposta)}
                  </td>
                  <td className="hidden text-ink-600 lg:table-cell">
                    {resp?.nome ?? "—"}
                  </td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="text-right font-medium tabular-nums">
                    {formatBRL(o.valor_total)}
                  </td>
                  <td className="hidden text-ink-500 sm:table-cell">
                    {formatDateBR(o.data_orcamento)}
                  </td>
                </tr>
              );
            })}
            {lista.length === 0 ? (
              <EmptyRow colSpan={7}>
                Nenhum orçamento para os filtros atuais.
              </EmptyRow>
            ) : null}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
}
