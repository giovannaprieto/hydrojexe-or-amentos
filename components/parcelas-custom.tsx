"use client";

import { useState } from "react";

import { IconClose, IconPlus } from "@/components/icons";

/**
 * Editor da lista "formas de pagamento extras" (nº de parcelas).
 * Emite um <input type="hidden" name={name}> com JSON do array (ex.: "[18,24]").
 * Base de preço dessas formas = 12x (tratado no cálculo/PDF).
 */
export function ParcelasCustom({
  name,
  inicial,
}: {
  name: string;
  inicial: number[];
}) {
  const [lista, setLista] = useState<string[]>(
    (inicial ?? []).map((n) => String(n)),
  );

  const numeros = lista
    .map((s) => Math.trunc(Number(s)))
    .filter((n) => Number.isFinite(n) && n >= 2);

  return (
    <div className="flex flex-col gap-2">
      <span className="hj-field-label">
        Formas de pagamento extras (nº de parcelas)
      </span>
      <span className="hj-hint">
        Usam os preços de 12x. Ex.: 18, 24, 36. Entram no PDF como opções a mais.
      </span>

      <input type="hidden" name={name} value={JSON.stringify(numeros)} />

      <div className="mt-1 flex flex-wrap items-center gap-2">
        {lista.map((v, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-lg border border-ink-300 bg-white py-1 pr-1 pl-2"
          >
            <input
              type="number"
              min="2"
              value={v}
              onChange={(e) =>
                setLista((l) => l.map((x, k) => (k === i ? e.target.value : x)))
              }
              className="w-12 border-0 bg-transparent p-0 text-right text-sm font-medium tabular-nums outline-none"
            />
            <span className="text-sm text-ink-500">x</span>
            <button
              type="button"
              onClick={() => setLista((l) => l.filter((_, k) => k !== i))}
              aria-label={`Remover ${v || "parcela"}`}
              className="ml-0.5 rounded p-1 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <IconClose className="size-3.5" />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setLista((l) => [...l, ""])}
          className="hj-btn hj-btn-secondary hj-btn-sm"
        >
          <IconPlus />
          Adicionar
        </button>
      </div>
    </div>
  );
}
