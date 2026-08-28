import Link from "next/link";

import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Condomínios · Hydrojexe" };

export default async function CondominiosPage() {
  await requireUsuario();

  const supabase = await createClient();
  const { data: condominios } = await supabase
    .from("condominios")
    .select("id, nome, cidade, uf, contato_nome, contato_telefone")
    .order("nome");

  const lista = condominios ?? [];

  return (
    <main className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Condomínios</h1>
        <Link
          href="/condominios/novo"
          className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background"
        >
          Novo condomínio
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 text-black/60 dark:border-white/10 dark:text-white/60">
            <tr>
              <th className="px-3 py-2 font-medium">Nome</th>
              <th className="px-3 py-2 font-medium">Cidade/UF</th>
              <th className="px-3 py-2 font-medium">Contato</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <tr
                key={c.id}
                className="border-b border-black/5 last:border-0 dark:border-white/5"
              >
                <td className="px-3 py-2">
                  <Link
                    href={`/condominios/${c.id}`}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {c.nome}
                  </Link>
                </td>
                <td className="px-3 py-2 text-black/70 dark:text-white/70">
                  {[c.cidade, c.uf].filter(Boolean).join(" / ") || "—"}
                </td>
                <td className="px-3 py-2 text-black/70 dark:text-white/70">
                  {[c.contato_nome, c.contato_telefone]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
              </tr>
            ))}
            {lista.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-4 text-center text-black/50 dark:text-white/50"
                >
                  Nenhum condomínio cadastrado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
