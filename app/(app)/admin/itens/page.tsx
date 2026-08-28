import Link from "next/link";

import { ItemForm } from "@/components/item-form";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Itens · Hydrojexe" };

export default async function ItensPage() {
  await requireAdmin();

  const supabase = await createClient();
  const { data: itens } = await supabase
    .from("itens_precificaveis")
    .select("id, nome, slug, unidade, is_tss, ativo, ordem")
    .order("ordem")
    .order("nome");

  const lista = itens ?? [];

  return (
    <main className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Itens precificáveis</h1>
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-black/60 dark:border-white/10 dark:text-white/60">
              <tr>
                <th className="px-3 py-2 font-medium">Nome</th>
                <th className="px-3 py-2 font-medium">Slug</th>
                <th className="px-3 py-2 font-medium">Unidade</th>
                <th className="px-3 py-2 font-medium">TSS</th>
                <th className="px-3 py-2 font-medium">Ativo</th>
                <th className="px-3 py-2 font-medium">Ordem</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((i) => (
                <tr
                  key={i.id}
                  className="border-b border-black/5 last:border-0 dark:border-white/5"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/itens/${i.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {i.nome}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-black/70 dark:text-white/70">
                    {i.slug}
                  </td>
                  <td className="px-3 py-2">{i.unidade}</td>
                  <td className="px-3 py-2">{i.is_tss ? "sim" : "—"}</td>
                  <td className="px-3 py-2">{i.ativo ? "sim" : "não"}</td>
                  <td className="px-3 py-2">{i.ordem}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Novo item</h2>
        <ItemForm />
      </section>
    </main>
  );
}
