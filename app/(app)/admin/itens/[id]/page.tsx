import { notFound } from "next/navigation";

import { excluirItem } from "@/app/(app)/admin/itens/actions";
import { IconTrash } from "@/components/icons";
import { ItemForm } from "@/components/item-form";
import { Alert, PageHeader } from "@/components/ui-layout";
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
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo={item.nome}
        voltar={{ href: "/admin/itens", rotulo: "Serviços e itens" }}
        descricao={item.slug}
      />

      {erro ? <Alert tom="error">{erro}</Alert> : null}

      <ItemForm inicial={item} />

      <section className="border-t border-ink-200 pt-6">
        <form action={excluirItem}>
          <input type="hidden" name="id" value={item.id} />
          <button type="submit" className="hj-btn hj-btn-danger">
            <IconTrash />
            Excluir item
          </button>
        </form>
      </section>
    </div>
  );
}
