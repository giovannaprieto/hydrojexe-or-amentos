import Link from "next/link";
import { notFound } from "next/navigation";

import { excluirCondominio } from "@/app/(app)/condominios/actions";
import { CondominioForm } from "@/components/condominio-form";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Condomínio · Hydrojexe" };

export default async function EditarCondominioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  await requireUsuario();
  const { id } = await params;
  const { erro } = await searchParams;

  const supabase = await createClient();
  const { data: condominio } = await supabase
    .from("condominios")
    .select("*")
    .eq("id", id)
    .single();
  if (!condominio) notFound();

  const { count } = await supabase
    .from("orcamentos")
    .select("id", { count: "exact", head: true })
    .eq("condominio_id", id);
  const orcamentos = count ?? 0;

  return (
    <main className="flex flex-col gap-6">
      <Link
        href="/condominios"
        className="text-sm text-black/60 dark:text-white/60"
      >
        ← Condomínios
      </Link>
      <h1 className="text-xl font-semibold">{condominio.nome}</h1>

      {erro ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
          {erro}
        </p>
      ) : null}

      <CondominioForm inicial={condominio} />

      <form
        action={excluirCondominio}
        className="mt-2 flex flex-col gap-1 border-t border-black/10 pt-4 dark:border-white/10"
      >
        <input type="hidden" name="id" value={condominio.id} />
        <button
          type="submit"
          className="w-fit rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          Excluir condomínio
        </button>
        {orcamentos > 0 ? (
          <span className="text-xs text-black/50 dark:text-white/50">
            Este condomínio tem {orcamentos} orçamento(s); a exclusão será
            bloqueada pelo banco.
          </span>
        ) : null}
      </form>
    </main>
  );
}
