import Link from "next/link";
import type { ReactNode } from "react";

import { IconArrowLeft } from "@/components/icons";

/* ==========================================================================
   Blocos de layout — Hydrojexe
   Componentes só de apresentação (sem estado), usáveis tanto em Server
   quanto em Client Components.
   ========================================================================== */

/** Cabeçalho de página: trilha de volta, título, descrição e ações. */
export function PageHeader({
  titulo,
  descricao,
  voltar,
  acoes,
  etiqueta,
}: {
  titulo: string;
  descricao?: ReactNode;
  voltar?: { href: string; rotulo: string };
  acoes?: ReactNode;
  etiqueta?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4">
      {voltar ? (
        <Link
          href={voltar.href}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-400"
        >
          <IconArrowLeft />
          {voltar.rotulo}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="hj-page-title">{titulo}</h1>
            {etiqueta}
          </div>
          {descricao ? (
            <p className="max-w-2xl hj-muted">{descricao}</p>
          ) : null}
        </div>
        {acoes ? (
          <div className="flex flex-wrap items-center gap-2">{acoes}</div>
        ) : null}
      </div>
    </header>
  );
}

/** Cartão com cabeçalho opcional. `plano` remove o padding interno. */
export function Card({
  titulo,
  descricao,
  acoes,
  plano,
  children,
  className,
}: {
  titulo?: string;
  descricao?: ReactNode;
  acoes?: ReactNode;
  plano?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`hj-card ${className ?? ""}`}>
      {titulo ? (
        <div className="hj-card-header">
          <div className="flex flex-col gap-0.5">
            <h2 className="hj-card-title">{titulo}</h2>
            {descricao ? (
              <p className="text-sm font-normal normal-case text-ink-500">
                {descricao}
              </p>
            ) : null}
          </div>
          {acoes ? (
            <div className="flex flex-wrap items-center gap-2">{acoes}</div>
          ) : null}
        </div>
      ) : null}
      <div className={plano ? "" : "hj-card-pad"}>{children}</div>
    </section>
  );
}

/** Contêiner de tabela com rolagem horizontal em telas pequenas. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="hj-table">{children}</table>
    </div>
  );
}

/** Linha de estado vazio dentro de uma tabela. */
export function EmptyRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: ReactNode;
}) {
  return (
    <tr className="hover:bg-transparent">
      <td colSpan={colSpan} className="px-4 py-10 text-center text-ink-400">
        {children}
      </td>
    </tr>
  );
}

/* --- Etiquetas ------------------------------------------------------------ */

export type TomBadge = "neutral" | "info" | "success" | "warn" | "danger";

export function Badge({
  tom = "neutral",
  children,
}: {
  tom?: TomBadge;
  children: ReactNode;
}) {
  return <span className={`hj-badge hj-badge-${tom}`}>{children}</span>;
}

const TOM_STATUS: Record<string, TomBadge> = {
  rascunho: "neutral",
  enviado: "info",
  aprovado: "success",
  recusado: "danger",
  cancelado: "warn",
};

const ROTULO_STATUS: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
  cancelado: "Cancelado",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tom={TOM_STATUS[status] ?? "neutral"}>
      {ROTULO_STATUS[status] ?? status}
    </Badge>
  );
}

/* --- Avisos --------------------------------------------------------------- */

export function Alert({
  tom = "info",
  children,
}: {
  tom?: "info" | "warn" | "error" | "success";
  children: ReactNode;
}) {
  return <div className={`hj-alert hj-alert-${tom}`}>{children}</div>;
}

/* --- Link com aparência de botão ------------------------------------------ */

export function LinkButton({
  href,
  variante = "secondary",
  externo,
  children,
  className,
}: {
  href: string;
  variante?: "primary" | "secondary" | "accent" | "ghost";
  externo?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const classes = `hj-btn hj-btn-${variante} ${className ?? ""}`;
  if (externo) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

/* --- Lista de definições (pares rótulo/valor) ----------------------------- */

export function DataList({
  itens,
  colunas = 3,
}: {
  itens: { rotulo: string; valor: ReactNode }[];
  colunas?: 2 | 3 | 4;
}) {
  const grid =
    colunas === 2
      ? "sm:grid-cols-2"
      : colunas === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <dl className={`grid gap-x-6 gap-y-4 ${grid}`}>
      {itens.map((it, i) => (
        <div key={i} className="flex flex-col gap-1">
          <dt className="hj-label">{it.rotulo}</dt>
          <dd className="text-sm font-medium text-navy-900">{it.valor}</dd>
        </div>
      ))}
    </dl>
  );
}
