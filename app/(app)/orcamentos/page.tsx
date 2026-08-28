import Link from "next/link";

import { IconPlus } from "@/components/icons";
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

export default async function OrcamentosPage() {
  await requireUsuario();

  const supabase = await createClient();
  const { data: orcamentos } = await supabase
    .from("orcamentos")
    .select(
      "id, numero, data_orcamento, status, tipo_proposta, valor_total, condominios(nome)",
    )
    .order("data_orcamento", { ascending: false })
    .order("numero", { ascending: false });

  const lista = orcamentos ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Orçamentos"
        descricao={
          lista.length > 0
            ? `${lista.length} orçamento(s) cadastrado(s).`
            : "Nenhum orçamento cadastrado ainda."
        }
        acoes={
          <LinkButton href="/orcamentos/novo" variante="primary">
            <IconPlus />
            Novo orçamento
          </LinkButton>
        }
      />

      <Card plano>
        <TableWrap>
          <thead>
            <tr>
              <th>Número</th>
              <th>Condomínio</th>
              <th className="hidden md:table-cell">Tipo</th>
              <th>Status</th>
              <th className="text-right">Total à vista</th>
              <th className="hidden sm:table-cell">Data</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((o) => {
              const condominio = o.condominios as { nome: string } | null;
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
              <EmptyRow colSpan={6}>
                Nenhum orçamento. Clique em “Novo orçamento” para começar.
              </EmptyRow>
            ) : null}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
}
