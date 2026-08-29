"use client";

import { IconRefresh } from "@/components/icons";

export default function ErroApp({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-red-50 text-red-500">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-7"
          aria-hidden
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="hj-page-title">Algo deu errado</h1>
        <p className="max-w-sm hj-muted">
          Não foi possível carregar esta tela. Tente novamente; se persistir,
          avise o suporte.
        </p>
      </div>
      <button type="button" onClick={reset} className="hj-btn hj-btn-primary">
        <IconRefresh />
        Tentar novamente
      </button>
      {error.digest ? (
        <p className="text-xs text-ink-400">ref: {error.digest}</p>
      ) : null}
    </div>
  );
}
