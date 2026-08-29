"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  IconBuilding,
  IconCalculadora,
  IconClose,
  IconDashboard,
  IconFormas,
  IconLogout,
  IconMenu,
  IconObra,
  IconOrcamento,
  IconPrecos,
  IconRelatorio,
  IconServicos,
  IconTextos,
  IconUsuarios,
} from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import type { UsuarioAtual } from "@/lib/auth";

type Item = {
  href: string;
  rotulo: string;
  Icone: (p: { className?: string }) => React.ReactElement;
  /** casa também com sub-rotas (ex.: /orcamentos/123) */
  prefixo?: boolean;
};

const PRINCIPAL: Item[] = [
  { href: "/", rotulo: "Dashboard", Icone: IconDashboard },
  { href: "/orcamentos", rotulo: "Orçamentos", Icone: IconOrcamento, prefixo: true },
  { href: "/condominios", rotulo: "Condomínios", Icone: IconBuilding, prefixo: true },
  { href: "/obras", rotulo: "Obras", Icone: IconObra, prefixo: true },
  { href: "/calculadora", rotulo: "Calculadora", Icone: IconCalculadora },
  { href: "/relatorios", rotulo: "Relatórios", Icone: IconRelatorio },
];

// Visíveis para todos (só o admin consegue alterar).
const CONFIG: Item[] = [
  { href: "/admin/itens", rotulo: "Serviços e itens", Icone: IconServicos, prefixo: true },
  { href: "/admin/precos", rotulo: "Tabela de preços", Icone: IconPrecos },
  {
    href: "/admin/formas-pagamento",
    rotulo: "Formas de pagamento",
    Icone: IconFormas,
    prefixo: true,
  },
];

// Só admin.
const ADMIN: Item[] = [
  { href: "/admin/textos", rotulo: "Textos-modelo", Icone: IconTextos },
  { href: "/admin/usuarios", rotulo: "Usuários", Icone: IconUsuarios },
];

function ativo(pathname: string, item: Item): boolean {
  if (item.href === "/") return pathname === "/";
  return item.prefixo ? pathname.startsWith(item.href) : pathname === item.href;
}

function iniciais(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppSidebar({ usuario }: { usuario: UsuarioAtual }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  const link = (item: Item) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => setAberto(false)}
      className={`hj-nav-link ${ativo(pathname, item) ? "hj-nav-link-active" : ""}`}
    >
      <item.Icone />
      <span className="truncate">{item.rotulo}</span>
    </Link>
  );

  return (
    <>
      {/* Barra superior — só em telas pequenas -------------------------------- */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-navy-800 bg-navy-900 px-4 py-3 text-white lg:hidden">
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="rounded-lg p-1.5 text-navy-100 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Abrir menu"
        >
          <IconMenu className="size-6" />
        </button>
        <Marca compacta />
      </div>

      {/* Sobreposição em telas pequenas --------------------------------------- */}
      {aberto ? (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setAberto(false)}
          className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-[2px] lg:hidden"
        />
      ) : null}

      {/* Navegação lateral ----------------------------------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-navy-900 transition-transform duration-200 lg:translate-x-0 ${
          aberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start gap-2 px-5 py-5">
          <Marca />
          <button
            type="button"
            onClick={() => setAberto(false)}
            className="rounded-lg p-1.5 text-navy-200 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <IconClose className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="flex flex-col gap-1">{PRINCIPAL.map(link)}</div>

          <p className="hj-nav-section">Configurações</p>
          <div className="flex flex-col gap-1">{CONFIG.map(link)}</div>

          {usuario.perfil === "admin" ? (
            <>
              <p className="hj-nav-section">Administração</p>
              <div className="flex flex-col gap-1">{ADMIN.map(link)}</div>
            </>
          ) : null}
        </nav>

        {/* Perfil ------------------------------------------------------------- */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Link
              href="/perfil"
              onClick={() => setAberto(false)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg transition-colors hover:opacity-90"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-500/25 text-sm font-semibold text-brand-200">
                {iniciais(usuario.nome)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-white">
                  {usuario.nome}
                </span>
                <span className="block truncate text-xs text-navy-300 capitalize">
                  {usuario.perfil}
                </span>
              </span>
            </Link>
            <ThemeToggle />
            <form action="/logout" method="post">
              <button
                type="submit"
                title="Sair"
                aria-label="Sair"
                className="rounded-lg p-2 text-navy-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <IconLogout className="size-5" />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}

function Marca({ compacta }: { compacta?: boolean }) {
  if (compacta) {
    return (
      <Link href="/" aria-label="Hydrojexe — início">
        <span className="grid place-items-center rounded-lg bg-white px-3 py-1.5 shadow-sm">
          <Image
            src="/logo-hydrojexe.png"
            alt="Hydrojexe"
            width={530}
            height={312}
            priority
            className="h-9 w-auto"
          />
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className="flex flex-1 flex-col gap-2"
      aria-label="Hydrojexe — início"
    >
      <span className="grid place-items-center rounded-xl bg-white px-5 py-4 shadow-sm">
        <Image
          src="/logo-hydrojexe.png"
          alt="Hydrojexe"
          width={530}
          height={312}
          priority
          className="h-20 w-auto"
        />
      </span>
      <span className="text-center text-[0.68rem] font-medium tracking-[0.2em] text-navy-300 uppercase">
        Orçamentos
      </span>
    </Link>
  );
}
