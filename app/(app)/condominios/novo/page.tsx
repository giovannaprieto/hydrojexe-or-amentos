import Link from "next/link";

import { CondominioForm } from "@/components/condominio-form";
import { requireUsuario } from "@/lib/auth";

export const metadata = { title: "Novo condomínio · Hydrojexe" };

export default async function NovoCondominioPage() {
  await requireUsuario();

  return (
    <main className="flex flex-col gap-6">
      <Link
        href="/condominios"
        className="text-sm text-black/60 dark:text-white/60"
      >
        ← Condomínios
      </Link>
      <h1 className="text-xl font-semibold">Novo condomínio</h1>
      <CondominioForm />
    </main>
  );
}
