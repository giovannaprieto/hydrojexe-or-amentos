import Link from "next/link";
import { notFound } from "next/navigation";

import { excluirForma } from "@/app/(app)/admin/formas-pagamento/actions";
import { FormaPagamentoForm } from "@/components/forma-pagamento-form";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Forma de pagamento · Hydrojexe" };

export default async function EditarFormaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { erro } = await searchParams;

  const supabase = await createClient();
  const [{ data: forma }, { data: todas }] = await Promise.all([
    supabase.from("formas_pagamento").select("*").eq("id", id).single(),
    supabase.from("formas_pagamento").select("id, nome").order("ordem"),
  ]);
  if (!forma) notFound();

  return (
    <main className="flex flex-col gap-6">
      <Link
        href="/admin/formas-pagamento"
        className="text-sm text-black/60 dark:text-white/60"
      >
        ← Formas de pagamento
      </Link>
      <h1 className="text-xl font-semibold">{forma.nome}</h1>

      {erro ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
          {erro}
        </p>
      ) : null}

      <FormaPagamentoForm inicial={forma} opcoes={todas ?? []} />

      <form
        action={excluirForma}
        className="mt-2 border-t border-black/10 pt-4 dark:border-white/10"
      >
        <input type="hidden" name="id" value={forma.id} />
        <button
          type="submit"
          className="w-fit rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          Excluir forma
        </button>
      </form>
    </main>
  );
}
