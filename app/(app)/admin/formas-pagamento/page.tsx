import Link from "next/link";

import { FormaPagamentoForm } from "@/components/forma-pagamento-form";
import {
  Badge,
  Card,
  EmptyRow,
  PageHeader,
  TableWrap,
} from "@/components/ui-layout";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Formas de pagamento · Hydrojexe" };

export default async function FormasPagamentoPage() {
  const usuario = await requireUsuario();
  const isAdmin = usuario.perfil === "admin";

  const supabase = await createClient();
  const { data: formas } = await supabase
    .from("formas_pagamento")
    .select("id, nome, slug, num_parcelas, usa_preco_de_forma_id, ordem, ativo")
    .order("ordem")
    .order("nome");

  const lista = formas ?? [];
  const nomePorId = new Map(lista.map((f) => [f.id, f.nome]));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Formas de pagamento"
        descricao="Cada forma tem sua própria coluna na tabela de preços. Uma forma pode reaproveitar o preço de outra."
      />

      <Card plano>
        <TableWrap>
          <thead>
            <tr>
              <th>Nome</th>
              <th className="hidden md:table-cell">Identificador</th>
              <th className="text-right">Parcelas</th>
              <th className="hidden lg:table-cell">Usa preço de</th>
              <th className="hidden sm:table-cell text-right">Ordem</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((f) => (
              <tr key={f.id}>
                <td>
                  {isAdmin ? (
                    <Link
                      href={`/admin/formas-pagamento/${f.id}`}
                      className="font-medium text-navy-900 underline-offset-4 hover:text-brand-600 hover:underline"
                    >
                      {f.nome}
                    </Link>
                  ) : (
                    <span className="font-medium text-navy-900">{f.nome}</span>
                  )}
                </td>
                <td className="hidden font-mono text-xs text-ink-500 md:table-cell">
                  {f.slug}
                </td>
                <td className="text-right tabular-nums">{f.num_parcelas}</td>
                <td className="hidden text-ink-600 lg:table-cell">
                  {f.usa_preco_de_forma_id
                    ? (nomePorId.get(f.usa_preco_de_forma_id) ?? "—")
                    : "—"}
                </td>
                <td className="hidden text-right text-ink-600 tabular-nums sm:table-cell">
                  {f.ordem}
                </td>
                <td>
                  <Badge tom={f.ativo ? "success" : "neutral"}>
                    {f.ativo ? "Ativa" : "Inativa"}
                  </Badge>
                </td>
              </tr>
            ))}
            {lista.length === 0 ? (
              <EmptyRow colSpan={6}>Nenhuma forma cadastrada.</EmptyRow>
            ) : null}
          </tbody>
        </TableWrap>
      </Card>

      {isAdmin ? (
        <section className="flex flex-col gap-3">
          <h2 className="hj-section-title">Nova forma de pagamento</h2>
          <FormaPagamentoForm
            opcoes={lista.map((f) => ({ id: f.id, nome: f.nome }))}
          />
        </section>
      ) : null}
    </div>
  );
}
