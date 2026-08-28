import { getUsuarioAtual } from "@/lib/auth";

export default async function Home() {
  const usuario = await getUsuarioAtual();

  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Olá, {usuario?.nome}</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        Você está autenticado como <strong>{usuario?.perfil}</strong>.
      </p>
      <p className="text-sm text-black/60 dark:text-white/60">
        Próximas etapas: cadastros (condomínios, itens, preços), montagem de
        orçamento com cálculo, e geração de PDF.
      </p>
    </main>
  );
}
