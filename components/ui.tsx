"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";

const controlBase =
  "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 disabled:opacity-60 dark:border-white/20 dark:focus:border-white/50";

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
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint ? (
        <span className="text-xs text-black/50 dark:text-white/50">{hint}</span>
      ) : null}
    </label>
  );
}

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={`${controlBase} ${className ?? ""}`} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={`${controlBase} ${className ?? ""}`} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea {...props} className={`${controlBase} min-h-20 ${className ?? ""}`} />
  );
}

export function Checkbox({
  label,
  ...props
}: ComponentProps<"input"> & { label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" {...props} className="size-4" />
      <span>{label}</span>
    </label>
  );
}

export function SubmitButton({
  children = "Salvar",
  pendingLabel = "Salvando…",
}: {
  children?: ReactNode;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-fit rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="text-sm text-red-600 dark:text-red-400">{message}</p>;
}
