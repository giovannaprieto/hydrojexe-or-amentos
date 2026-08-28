"use client";

import { FORMAS_PAGAMENTO_BASE, rotuloFormaBase } from "@/lib/formas-pagamento";

/**
 * Checkboxes das formas de pagamento base (à vista / 6x / 9x / 12x) que
 * entram na proposta. Emite um <input name="formas_visiveis" value="<n>">
 * por opção marcada — a action lê com formData.getAll("formas_visiveis").
 */
export function FormasPagamentoVisiveis({ inicial }: { inicial: number[] }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <span className="hj-field-label">Formas de pagamento no PDF</span>
      <span className="hj-hint">
        Marque as que devem aparecer na proposta. Para condições fora do padrão,
        use “Formas de pagamento extras” abaixo.
      </span>

      <div className="mt-1 flex flex-wrap gap-x-5 gap-y-2">
        {FORMAS_PAGAMENTO_BASE.map((n) => (
          <label
            key={n}
            className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-navy-800"
          >
            <input
              type="checkbox"
              name="formas_visiveis"
              value={n}
              defaultChecked={inicial.includes(n)}
              className="size-4 rounded border-ink-300 accent-brand-500"
            />
            {rotuloFormaBase(n)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
