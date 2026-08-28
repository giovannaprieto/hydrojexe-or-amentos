import { notFound } from "next/navigation";

import { excluirCondominio } from "@/app/(app)/condominios/actions";
import { CondominioForm } from "@/components/condominio-form";
import { IconTrash } from "@/components/icons";
import { Alert, Badge, PageHeader } from "@/components/ui-layout";
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
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo={condominio.nome}
        voltar={{ href: "/condominios", rotulo: "Condomínios" }}
        etiqueta={
          orcamentos > 0 ? (
            <Badge tom="info">{orcamentos} orçamento(s)</Badge>
          ) : null
        }
        descricao={
          [condominio.cidade, condominio.uf].filter(Boolean).join(" / ") ||
          undefined
        }
      />

      {erro ? <Alert tom="error">{erro}</Alert> : null}

      <CondominioForm inicial={condominio} />

      <section className="flex flex-col gap-2 border-t border-ink-200 pt-6">
        <form action={excluirCondominio}>
          <input type="hidden" name="id" value={condominio.id} />
          <button type="submit" className="hj-btn hj-btn-danger">
            <IconTrash />
            Excluir condomínio
          </button>
        </form>
        {orcamentos > 0 ? (
          <span className="hj-hint">
            Este condomínio tem {orcamentos} orçamento(s); a exclusão será
            bloqueada pelo banco.
          </span>
        ) : null}
      </section>
    </div>
  );
}
