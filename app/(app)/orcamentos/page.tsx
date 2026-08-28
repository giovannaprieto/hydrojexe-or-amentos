import Link from "next/link";

import { requireUsuario } from "@/lib/auth";
import { formatBRL, formatDateBR } from "@/lib/format";
import { rotuloTipoProposta } from "@/lib/orcamento-tipos";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Orçamentos · Hydrojexe" };

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
  cancelado: "Cancelado",
};

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
    <main className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Orçamentos</h1>
        <Link
          href="/orcamentos/novo"
          className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background"
        >
          Novo orçamento
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 text-black/60 dark:border-white/10 dark:text-white/60">
            <tr>
              <th className="px-3 py-2 font-medium">Número</th>
              <th className="px-3 py-2 font-medium">Condomínio</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 text-right font-medium">Total à vista</th>
              <th className="px-3 py-2 font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((o) => {
              const condominio = o.condominios as { nome: string } | null;
              return (
                <tr
                  key={o.id}
                  className="border-b border-black/5 last:border-0 dark:border-white/5"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/orcamentos/${o.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {o.numero}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{condominio?.nome ?? "—"}</td>
                  <td className="px-3 py-2 text-black/70 dark:text-white/70">
                    {rotuloTipoProposta(o.tipo_proposta)}
                  </td>
                  <td className="px-3 py-2">
                    {STATUS_LABEL[o.status] ?? o.status}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatBRL(o.valor_total)}
                  </td>
                  <td className="px-3 py-2 text-black/70 dark:text-white/70">
                    {formatDateBR(o.data_orcamento)}
                  </td>
                </tr>
              );
            })}
            {lista.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-black/50 dark:text-white/50"
                >
                  Nenhum orçamento.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
