"use client";

import { useActionState, useState } from "react";

import { salvarTssLight } from "@/app/(app)/orcamentos/actions";
import { Field, FormError, SubmitButton, TextInput } from "@/components/ui";
import { formatBRL } from "@/lib/format";
import { emptyFormState } from "@/lib/forms";
import { textoFormaTss } from "@/lib/modelos-proposta";

type Linha = { valor: string; parcelas: string };

export type TssLightInicial = {
  id: string;
  qtd_equipamentos: number;
  opcoes: { valor: number; parcelas: number }[];
};

export function TssLightForm({ inicial }: { inicial: TssLightInicial }) {
  const [state, formAction] = useActionState(salvarTssLight, emptyFormState);

  const [qtd, setQtd] = useState(String(inicial.qtd_equipamentos || 1));
  const [linhas, setLinhas] = useState<Linha[]>(
    inicial.opcoes.length > 0
      ? inicial.opcoes.map((o) => ({
          valor: String(o.valor),
          parcelas: String(o.parcelas),
        }))
      : [{ valor: "", parcelas: "1" }],
  );

  const setLinha = (i: number, patch: Partial<Linha>) =>
    setLinhas((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const addLinha = () =>
    setLinhas((ls) => (ls.length >= 4 ? ls : [...ls, { valor: "", parcelas: "1" }]));
  const rmLinha = (i: number) =>
    setLinhas((ls) => (ls.length <= 1 ? ls : ls.filter((_, j) => j !== i)));

  const parsed = linhas.map((l) => ({
    valor: Number(l.valor.replace(",", ".")) || 0,
    parcelas: Math.trunc(Number(l.parcelas) || 0),
  }));
  const opcoesJson = JSON.stringify(parsed);
  const snapshot =
    parsed.find((o) => o.parcelas <= 1)?.valor ?? parsed[0]?.valor ?? 0;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 dark:border-white/10"
    >
      <input type="hidden" name="id" value={inicial.id} />
      <input type="hidden" name="opcoes" value={opcoesJson} />

      <p className="text-sm text-black/60 dark:text-white/60">
        Proposta <strong>TSS Light</strong>. Sem tipos de apartamento. Até 4
        opções de investimento — parcelamento sem entrada (“Em 0Nx de R$
        valor÷N”); use <strong>1</strong> parcela para “à vista”.
      </p>

      <Field label="Qtd. de equipamentos *">
        <TextInput
          type="number"
          min="1"
          step="1"
          name="qtd_equipamentos"
          required
          value={qtd}
          onChange={(e) => setQtd(e.target.value)}
          className="w-40"
        />
      </Field>

      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium">Opções de investimento</span>
        {linhas.map((l, i) => {
          const valorN = Number(l.valor.replace(",", ".")) || 0;
          const parcelasN = Math.trunc(Number(l.parcelas) || 0);
          return (
            <div
              key={i}
              className="flex flex-wrap items-end gap-3 rounded-md border border-black/10 p-3 dark:border-white/10"
            >
              <span className="text-sm font-medium">Opção {i + 1}</span>
              <Field label="Valor por unidade (R$)">
                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={l.valor}
                  onChange={(e) => setLinha(i, { valor: e.target.value })}
                  className="w-36"
                />
              </Field>
              <Field label="Nº de parcelas">
                <TextInput
                  type="number"
                  min="1"
                  step="1"
                  value={l.parcelas}
                  onChange={(e) => setLinha(i, { parcelas: e.target.value })}
                  className="w-28"
                />
              </Field>
              <span className="pb-2 text-sm text-black/60 dark:text-white/60">
                {valorN > 0
                  ? textoFormaTss({ valor: valorN, parcelas: parcelasN })
                  : "—"}
              </span>
              {linhas.length > 1 ? (
                <button
                  type="button"
                  onClick={() => rmLinha(i)}
                  className="pb-2 text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  remover
                </button>
              ) : null}
            </div>
          );
        })}
        {linhas.length < 4 ? (
          <button
            type="button"
            onClick={addLinha}
            className="self-start text-sm text-black/70 hover:underline dark:text-white/70"
          >
            + adicionar opção
          </button>
        ) : null}
      </div>

      <div className="rounded-md bg-black/5 px-3 py-2 text-sm dark:bg-white/10">
        Snapshot (Total à vista): <strong>{formatBRL(snapshot)}</strong>
      </div>

      {state.ok ? (
        <p className="text-sm text-green-700 dark:text-green-400">
          {state.mensagem ?? "Salvo."}
        </p>
      ) : null}
      <FormError message={state.error} />
      <SubmitButton>Salvar TSS Light</SubmitButton>
    </form>
  );
}
