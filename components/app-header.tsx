import Link from "next/link";

import type { UsuarioAtual } from "@/lib/auth";

const linkClass =
  "text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white";

export function AppHeader({ usuario }: { usuario: UsuarioAtual }) {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-3">
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/" className="font-semibold">
            Hydrojexe
          </Link>
          <Link href="/orcamentos" className={linkClass}>
            Orçamentos
          </Link>
          <Link href="/condominios" className={linkClass}>
            Condomínios
          </Link>
          {usuario.perfil === "admin" ? (
            <>
              <Link href="/admin/formas-pagamento" className={linkClass}>
                Formas de pagamento
              </Link>
              <Link href="/admin/itens" className={linkClass}>
                Itens
              </Link>
              <Link href="/admin/precos" className={linkClass}>
                Preços
              </Link>
              <Link href="/admin/textos" className={linkClass}>
                Textos
              </Link>
              <Link href="/admin/usuarios" className={linkClass}>
                Usuários
              </Link>
            </>
          ) : null}
        </nav>

        <form
          action="/logout"
          method="post"
          className="flex items-center gap-3 text-sm"
        >
          <span className="text-black/60 dark:text-white/60">
            {usuario.nome}
            <span className="mx-1">·</span>
            <span className="capitalize">{usuario.perfil}</span>
          </span>
          <button
            type="submit"
            className="rounded-md border border-black/15 px-2.5 py-1 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
