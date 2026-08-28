import { CondominioForm } from "@/components/condominio-form";
import { PageHeader } from "@/components/ui-layout";
import { requireUsuario } from "@/lib/auth";

export const metadata = { title: "Novo condomínio · Hydrojexe" };

export default async function NovoCondominioPage() {
  await requireUsuario();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Novo condomínio"
        descricao="Os dados abaixo aparecem no cabeçalho das propostas em PDF."
        voltar={{ href: "/condominios", rotulo: "Condomínios" }}
      />
      <CondominioForm />
    </div>
  );
}
