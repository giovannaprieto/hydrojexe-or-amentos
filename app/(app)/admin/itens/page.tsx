import Link from "next/link";

import { ItemForm } from "@/components/item-form";
import {
  Badge,
  Card,
  EmptyRow,
  PageHeader,
  TableWrap,
} from "@/components/ui-layout";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Serviços e itens · Hydrojexe" };

export default async function ItensPage() {
  const usuario = await requireUsuario();
  const isAdmin = usuario.perfil === "admin";

  const supabase = await createClient();
  const { data: itens } = await supabase
    .from("itens_precificaveis")
    .select("id, nome, slug, unidade, is_tss, ativo, ordem")
    .order("ordem")
    .order("nome");

  const lista = itens ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Serviços e itens"
        descricao="Itens precificáveis usados na composição dos orçamentos (hidrômetros, válvulas, TSS…)."
      />

      <Card plano>
        <TableWrap>
          <thead>
            <tr>
              <th>Nome</th>
              <th className="hidden md:table-cell">Identificador</th>
              <th>Unidade</th>
              <th className="hidden sm:table-cell">Ordem</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((i) => (
              <tr key={i.id}>
                <td>
                  {isAdmin ? (
                    <Link
                      href={`/admin/itens/${i.id}`}
                      className="font-medium text-navy-900 underline-offset-4 hover:text-brand-600 hover:underline"
                    >
                      {i.nome}
                    </Link>
                  ) : (
                    <span className="font-medium text-navy-900">{i.nome}</span>
                  )}
                </td>
                <td className="hidden font-mono text-xs text-ink-500 md:table-cell">
                  {i.slug}
                </td>
                <td className="text-ink-600">{i.unidade}</td>
                <td className="hidden text-ink-600 tabular-nums sm:table-cell">
                  {i.ordem}
                </td>
                <td>
                  <div className="flex flex-wrap gap-1.5">
                    {i.is_tss ? <Badge tom="info">TSS</Badge> : null}
                    <Badge tom={i.ativo ? "success" : "neutral"}>
                      {i.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </td>
              </tr>
            ))}
            {lista.length === 0 ? (
              <EmptyRow colSpan={5}>Nenhum item cadastrado.</EmptyRow>
            ) : null}
          </tbody>
        </TableWrap>
      </Card>

      {isAdmin ? (
        <section className="flex flex-col gap-3">
          <h2 className="hj-section-title">Novo item</h2>
          <ItemForm />
        </section>
      ) : null}
    </div>
  );
}
