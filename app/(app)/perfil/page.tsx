import { PerfilForm } from "@/components/perfil-form";
import { DataList, PageHeader } from "@/components/ui-layout";
import { requireUsuario } from "@/lib/auth";

export const metadata = { title: "Meu perfil · Hydrojexe" };

export default async function PerfilPage() {
  const usuario = await requireUsuario();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader titulo="Meu perfil" />

      <DataList
        colunas={3}
        itens={[
          { rotulo: "Nome", valor: usuario.nome },
          { rotulo: "E-mail", valor: usuario.email },
          {
            rotulo: "Perfil",
            valor: usuario.perfil === "admin" ? "Administrador" : "Comercial",
          },
        ]}
      />

      <PerfilForm />
    </div>
  );
}
