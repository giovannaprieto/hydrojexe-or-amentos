"use client";

import { useActionState, useState } from "react";

import { salvarDeducoes } from "@/app/(app)/obras/actions";
import { IconCheck, IconPlus, IconTrash } from "@/components/icons";
import { FormError, FormSuccess, SubmitButton } from "@/components/ui";
import { formatBRL } from "@/lib/format";
import { emptyFormState } from "@/lib/forms";

type Linha = { descricao: string; valor: string };

const n = (s: string) => Number(s.replace(",", ".")) || 0;
const vazia = (): Linha => ({ descricao: "", valor: "" });

export function ObraDeducoes({
  obraId,
  inicial,
}: {
  obraId: string;
  inicial: Linha[];
}) {
  const [state, formAction] = useActionState(salvarDeducoes, emptyFormState);
  const [linhas, setLinhas] = useState<Linha[]>(
    inicial.length > 0 ? inicial : [vazia()],
  );

  const set = (i: number, patch: Partial<Linha>) =>
    setLinhas((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const total = linhas.reduce((a, l) => a + n(l.valor), 0);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={obraId} />
      <input type="hidden" name="linhas" value={JSON.stringify(linhas)} />

      <p className="hj-hint">
        Impostos, retenções e outros descontos sobre a receita (ISS, IRRF, PIS,
        COFINS, taxa de administração…). Entram antes dos custos, no cálculo da
        receita líquida.
      </p>

      <div className="flex flex-col gap-2">
        {linhas.map((l, i) => (
          <div
            key={i}
            className="flex flex-wrap items-end gap-2 rounded-lg border border-ink-200 bg-ink-50/40 p-3"
          >
            <input
              value={l.descricao}
              onChange={(e) => set(i, { descricao: e.target.value })}
              placeholder="Descrição (ex.: ISS 5%)"
              className="hj-control min-w-[12rem] flex-1"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={l.valor}
              onChange={(e) => set(i, { valor: e.target.value })}
              placeholder="R$"
              className="hj-control w-32"
              aria-label="Valor"
            />
            <button
              type="button"
              onClick={() => setLinhas((ls) => ls.filter((_, j) => j !== i))}
              aria-label="Remover"
              className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600"
            >
              <IconTrash className="size-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLinhas((ls) => [...ls, vazia()])}
          className="hj-btn hj-btn-secondary hj-btn-sm w-fit"
        >
          <IconPlus />
          Dedução
        </button>
      </div>

      <div className="flex items-baseline gap-3 rounded-lg bg-navy-900 px-5 py-3">
        <span className="text-xs font-semibold tracking-wide text-brand-200 uppercase">
          Total de deduções
        </span>
        <span className="text-lg font-semibold text-white tabular-nums">
          {formatBRL(total)}
        </span>
      </div>

      {state.ok ? <FormSuccess message={state.mensagem ?? "Salvo."} /> : null}
      <FormError message={state.error} />
      <div className="flex justify-end">
        <SubmitButton icone={<IconCheck />}>Salvar deduções</SubmitButton>
      </div>
    </form>
  );
}
