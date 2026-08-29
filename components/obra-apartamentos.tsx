"use client";

import { useActionState, useState } from "react";

import { salvarApartamentosObra } from "@/app/(app)/obras/actions";
import { IconCheck, IconPlus, IconTrash } from "@/components/icons";
import { FormError, FormSuccess, SubmitButton } from "@/components/ui";
import { STATUS_APARTAMENTO } from "@/lib/obras";
import { emptyFormState } from "@/lib/forms";

type Linha = {
  identificacao: string;
  status: string;
  data_conclusao: string;
  observacao: string;
};

const vazia = (): Linha => ({
  identificacao: "",
  status: "pendente",
  data_conclusao: "",
  observacao: "",
});

export function ObraApartamentos({
  obraId,
  inicial,
}: {
  obraId: string;
  inicial: Linha[];
}) {
  const [state, formAction] = useActionState(
    salvarApartamentosObra,
    emptyFormState,
  );
  const [linhas, setLinhas] = useState<Linha[]>(
    inicial.length > 0 ? inicial : [vazia()],
  );
  const [gerar, setGerar] = useState("");

  const set = (i: number, patch: Partial<Linha>) =>
    setLinhas((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const gerarN = () => {
    const n = Math.trunc(Number(gerar) || 0);
    if (n <= 0) return;
    const base = linhas.filter((l) => l.identificacao.trim());
    const inicioNum = base.length + 1;
    const novos = Array.from({ length: n }, (_, k) => ({
      ...vazia(),
      identificacao: `Apto ${inicioNum + k}`,
    }));
    setLinhas([...base, ...novos]);
    setGerar("");
  };

  const concluidos = linhas.filter((l) => l.status === "concluido").length;
  const total = linhas.filter((l) => l.identificacao.trim()).length;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={obraId} />
      <input type="hidden" name="linhas" value={JSON.stringify(linhas)} />

      <div className="flex flex-wrap items-center gap-3">
        <span className="hj-hint">
          {concluidos}/{total} concluído(s)
        </span>
        <span className="ml-auto flex items-center gap-2">
          <input
            type="number"
            min="1"
            value={gerar}
            onChange={(e) => setGerar(e.target.value)}
            placeholder="Qtd."
            className="hj-control w-20"
          />
          <button
            type="button"
            onClick={gerarN}
            className="hj-btn hj-btn-secondary hj-btn-sm"
          >
            Gerar apartamentos
          </button>
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {linhas.map((l, i) => (
          <div
            key={i}
            className="flex flex-wrap items-end gap-2 rounded-lg border border-ink-200 bg-ink-50/40 p-3"
          >
            <input
              value={l.identificacao}
              onChange={(e) => set(i, { identificacao: e.target.value })}
              placeholder="Apto / unidade"
              className="hj-control w-36"
            />
            <select
              value={l.status}
              onChange={(e) => set(i, { status: e.target.value })}
              className="hj-control w-36"
            >
              {STATUS_APARTAMENTO.map((s) => (
                <option key={s.valor} value={s.valor}>
                  {s.rotulo}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={l.data_conclusao}
              onChange={(e) => set(i, { data_conclusao: e.target.value })}
              className="hj-control w-40"
            />
            <input
              value={l.observacao}
              onChange={(e) => set(i, { observacao: e.target.value })}
              placeholder="Observação"
              className="hj-control flex-1"
            />
            <button
              type="button"
              onClick={() =>
                setLinhas((ls) => ls.filter((_, j) => j !== i))
              }
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
          Apartamento
        </button>
      </div>

      {state.ok ? <FormSuccess message={state.mensagem ?? "Salvo."} /> : null}
      <FormError message={state.error} />
      <div className="flex justify-end">
        <SubmitButton icone={<IconCheck />}>Salvar apartamentos</SubmitButton>
      </div>
    </form>
  );
}
