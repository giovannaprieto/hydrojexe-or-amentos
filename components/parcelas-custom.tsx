"use client";

import { useState } from "react";

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
    <div className="flex flex-col gap-2 text-sm">
      <span className="font-medium">Formas de pagamento extras (nº de parcelas)</span>
      <span className="text-xs text-black/50 dark:text-white/50">
        Usam os preços de 12x. Ex.: 18, 24, 36. Entram no PDF como opções a mais.
      </span>

      <input type="hidden" name={name} value={JSON.stringify(numeros)} />

      <div className="flex flex-wrap items-center gap-2">
        {lista.map((v, i) => (
          <div key={i} className="flex items-center gap-1">
            <input
              type="number"
              min="2"
              value={v}
              onChange={(e) =>
                setLista((l) => l.map((x, k) => (k === i ? e.target.value : x)))
              }
              className="w-20 rounded-md border border-black/15 bg-transparent px-2 py-1 text-right outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
            />
            <span className="text-black/50 dark:text-white/50">x</span>
            <button
              type="button"
              onClick={() => setLista((l) => l.filter((_, k) => k !== i))}
              className="text-xs text-red-600 hover:underline dark:text-red-400"
            >
              remover
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLista((l) => [...l, ""])}
          className="rounded-md border border-black/15 px-2 py-1 text-xs hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          + adicionar
        </button>
      </div>
    </div>
  );
}
