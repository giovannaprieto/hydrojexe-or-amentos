"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";

/* ==========================================================================
   Controles de formulário — Hydrojexe
   ========================================================================== */

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="hj-field-label">{label}</span>
      {children}
      {hint ? <span className="hj-hint">{hint}</span> : null}
    </label>
  );
}

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={`hj-control ${className ?? ""}`} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={`hj-control ${className ?? ""}`} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={`hj-control min-h-24 leading-relaxed ${className ?? ""}`}
    />
  );
}

export function Checkbox({
  label,
  className,
  ...props
}: ComponentProps<"input"> & { label: string }) {
  return (
    <label
      className={`flex w-fit cursor-pointer items-center gap-2.5 text-sm text-ink-800 ${className ?? ""}`}
    >
      <input
        type="checkbox"
        {...props}
        className="size-4 cursor-pointer rounded border-ink-300 accent-brand-500"
      />
      <span>{label}</span>
    </label>
  );
}

/* --- Botões --------------------------------------------------------------- */

type Variante = "primary" | "secondary" | "accent" | "ghost" | "danger";

const VARIANTE: Record<Variante, string> = {
  primary: "hj-btn-primary",
  secondary: "hj-btn-secondary",
  accent: "hj-btn-accent",
  ghost: "hj-btn-ghost",
  danger: "hj-btn-danger",
};

export function Button({
  variante = "secondary",
  pequeno,
  className,
  ...props
}: ComponentProps<"button"> & { variante?: Variante; pequeno?: boolean }) {
  return (
    <button
      {...props}
      className={`hj-btn ${VARIANTE[variante]} ${pequeno ? "hj-btn-sm" : ""} ${className ?? ""}`}
    />
  );
}

export function SubmitButton({
  children = "Salvar",
  pendingLabel = "Salvando…",
  variante = "primary",
  className,
  icone,
}: {
  children?: ReactNode;
  pendingLabel?: string;
  variante?: Variante;
  className?: string;
  icone?: ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`hj-btn ${VARIANTE[variante]} w-fit ${className ?? ""}`}
    >
      {pending ? (
        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icone
      )}
      {pending ? pendingLabel : children}
    </button>
  );
}

/* --- Mensagens ------------------------------------------------------------ */

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="hj-alert hj-alert-error">{message}</p>;
}

export function FormSuccess({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="hj-alert hj-alert-success">{message}</p>;
}
