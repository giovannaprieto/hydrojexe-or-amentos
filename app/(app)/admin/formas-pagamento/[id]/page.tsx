import { notFound } from "next/navigation";

import { excluirForma } from "@/app/(app)/admin/formas-pagamento/actions";
import { FormaPagamentoForm } from "@/components/forma-pagamento-form";
import { IconTrash } from "@/components/icons";
import { Alert, PageHeader } from "@/components/ui-layout";
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
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo={forma.nome}
        voltar={{
          href: "/admin/formas-pagamento",
          rotulo: "Formas de pagamento",
        }}
        descricao={forma.slug}
      />

      {erro ? <Alert tom="error">{erro}</Alert> : null}

      <FormaPagamentoForm inicial={forma} opcoes={todas ?? []} />

      <section className="border-t border-ink-200 pt-6">
        <form action={excluirForma}>
          <input type="hidden" name="id" value={forma.id} />
          <button type="submit" className="hj-btn hj-btn-danger">
            <IconTrash />
            Excluir forma
          </button>
        </form>
      </section>
    </div>
  );
}
