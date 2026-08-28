import Link from "next/link";
import { notFound } from "next/navigation";

import { excluirItem } from "@/app/(app)/admin/itens/actions";
import { ItemForm } from "@/components/item-form";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Item · Hydrojexe" };

export default async function EditarItemPage({
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
  const { data: item } = await supabase
    .from("itens_precificaveis")
    .select("*")
    .eq("id", id)
    .single();
  if (!item) notFound();

  return (
    <main className="flex flex-col gap-6">
      <Link
        href="/admin/itens"
        className="text-sm text-black/60 dark:text-white/60"
      >
        ← Itens
      </Link>
      <h1 className="text-xl font-semibold">{item.nome}</h1>

      {erro ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
          {erro}
        </p>
      ) : null}

      <ItemForm inicial={item} />

      <form
        action={excluirItem}
        className="mt-2 border-t border-black/10 pt-4 dark:border-white/10"
      >
        <input type="hidden" name="id" value={item.id} />
        <button
          type="submit"
          className="w-fit rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          Excluir item
        </button>
      </form>
    </main>
  );
}
