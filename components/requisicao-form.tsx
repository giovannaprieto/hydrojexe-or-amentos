"use client";

import { useActionState, useState } from "react";

import { salvarRequisicao } from "@/app/(app)/obras/actions";
import { IconCheck, IconPlus, IconTrash } from "@/components/icons";
import {
  Field,
  FormError,
  FormSuccess,
  SubmitButton,
  TextInput,
} from "@/components/ui";
import { formatBRL } from "@/lib/format";
import { emptyFormState } from "@/lib/forms";

type Material = {
  descricao: string;
  quantidade: string;
  unidade: string;
  valor_unitario: string;
};

const n = (s: string) => Number(s.replace(",", ".")) || 0;
const vazio = (): Material => ({
  descricao: "",
  quantidade: "1",
  unidade: "un",
  valor_unitario: "",
});

export function RequisicaoForm({
  obraId,
  linhasIniciais = [],
}: {
  obraId: string;
  linhasIniciais?: Material[];
}) {
  const [state, formAction] = useActionState(salvarRequisicao, emptyFormState);
  const [mats, setMats] = useState<Material[]>(
    linhasIniciais.length > 0 ? linhasIniciais : [vazio()],
  );

  const set = (i: number, patch: Partial<Material>) =>
    setMats((m) => m.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const total = mats.reduce(
    (a, m) => a + n(m.quantidade) * n(m.valor_unitario),
    0,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="obra_id" value={obraId} />
      <input type="hidden" name="materiais" value={JSON.stringify(mats)} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Nº da requisição">
          <TextInput name="numero" />
        </Field>
        <Field label="Data">
          <TextInput type="date" name="data" />
        </Field>
        <Field label="PDF da requisição">
          <input
            type="file"
            name="arquivo"
            accept="application/pdf"
            className="hj-control py-1.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ink-100 file:px-2 file:py-1 file:text-xs"
          />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <span className="hj-field-label">Materiais</span>
        {mats.map((m, i) => {
          const sub = n(m.quantidade) * n(m.valor_unitario);
          return (
            <div
              key={i}
              className="flex flex-wrap items-end gap-2 rounded-lg border border-ink-200 bg-ink-50/40 p-3"
            >
              <input
                value={m.descricao}
                onChange={(e) => set(i, { descricao: e.target.value })}
                placeholder="Descrição do material"
                className="hj-control min-w-[10rem] flex-1"
              />
              <input
                type="number"
                min="0"
                step="0.001"
                value={m.quantidade}
                onChange={(e) => set(i, { quantidade: e.target.value })}
                className="hj-control w-20"
                aria-label="Quantidade"
              />
              <input
                value={m.unidade}
                onChange={(e) => set(i, { unidade: e.target.value })}
                className="hj-control w-16"
                aria-label="Unidade"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={m.valor_unitario}
                onChange={(e) => set(i, { valor_unitario: e.target.value })}
                placeholder="R$ unit."
                className="hj-control w-28"
                aria-label="Valor unitário"
              />
              <span className="w-24 text-right text-sm font-medium tabular-nums">
                {formatBRL(sub)}
              </span>
              <button
                type="button"
                onClick={() => setMats((x) => x.filter((_, j) => j !== i))}
                aria-label="Remover"
                className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600"
              >
                <IconTrash className="size-4" />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setMats((x) => [...x, vazio()])}
          className="hj-btn hj-btn-secondary hj-btn-sm w-fit"
        >
          <IconPlus />
          Material
        </button>
      </div>

      <div className="flex items-baseline gap-3 rounded-lg bg-navy-900 px-5 py-3">
        <span className="text-xs font-semibold tracking-wide text-brand-200 uppercase">
          Total da requisição
        </span>
        <span className="text-lg font-semibold text-white tabular-nums">
          {formatBRL(total)}
        </span>
      </div>

      {state.ok ? <FormSuccess message={state.mensagem ?? "Salvo."} /> : null}
      <FormError message={state.error} />
      <div className="flex justify-end">
        <SubmitButton icone={<IconCheck />} pendingLabel="Salvando…">
          Salvar requisição
        </SubmitButton>
      </div>
    </form>
  );
}
