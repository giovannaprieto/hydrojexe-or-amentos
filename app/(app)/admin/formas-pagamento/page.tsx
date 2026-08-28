import Link from "next/link";

import { FormaPagamentoForm } from "@/components/forma-pagamento-form";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Formas de pagamento · Hydrojexe" };

export default async function FormasPagamentoPage() {
  await requireAdmin();

  const supabase = await createClient();
  const { data: formas } = await supabase
    .from("formas_pagamento")
    .select("id, nome, slug, num_parcelas, usa_preco_de_forma_id, ordem, ativo")
    .order("ordem")
    .order("nome");

  const lista = formas ?? [];
  const nomePorId = new Map(lista.map((f) => [f.id, f.nome]));

  return (
    <main className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Formas de pagamento</h1>
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-black/60 dark:border-white/10 dark:text-white/60">
              <tr>
                <th className="px-3 py-2 font-medium">Nome</th>
                <th className="px-3 py-2 font-medium">Slug</th>
                <th className="px-3 py-2 font-medium">Parcelas</th>
                <th className="px-3 py-2 font-medium">Usa preço de</th>
                <th className="px-3 py-2 font-medium">Ordem</th>
                <th className="px-3 py-2 font-medium">Ativa</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((f) => (
                <tr
                  key={f.id}
                  className="border-b border-black/5 last:border-0 dark:border-white/5"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/formas-pagamento/${f.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {f.nome}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-black/70 dark:text-white/70">
                    {f.slug}
                  </td>
                  <td className="px-3 py-2">{f.num_parcelas}</td>
                  <td className="px-3 py-2 text-black/70 dark:text-white/70">
                    {f.usa_preco_de_forma_id
                      ? (nomePorId.get(f.usa_preco_de_forma_id) ?? "—")
                      : "—"}
                  </td>
                  <td className="px-3 py-2">{f.ordem}</td>
                  <td className="px-3 py-2">{f.ativo ? "sim" : "não"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Nova forma de pagamento</h2>
        <FormaPagamentoForm
          opcoes={lista.map((f) => ({ id: f.id, nome: f.nome }))}
        />
      </section>
    </main>
  );
}
