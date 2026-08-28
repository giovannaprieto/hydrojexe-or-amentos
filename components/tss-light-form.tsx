"use client";

import { useActionState, useState } from "react";

import { salvarTssLight } from "@/app/(app)/orcamentos/actions";
import { IconCheck, IconPlus, IconTrash } from "@/components/icons";
import {
  Field,
  FormError,
  FormSuccess,
  SubmitButton,
  TextInput,
} from "@/components/ui";
import { Card } from "@/components/ui-layout";
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
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="id" value={inicial.id} />
      <input type="hidden" name="opcoes" value={opcoesJson} />

      <Card
        titulo="Equipamento"
        descricao="Proposta TSS Light — sem tipos de apartamento."
      >
        <div className="max-w-xs">
          <Field label="Qtd. de equipamentos *">
            <TextInput
              type="number"
              min="1"
              step="1"
              name="qtd_equipamentos"
              required
              value={qtd}
              onChange={(e) => setQtd(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card
        titulo="Opções de investimento"
        descricao="Até 4 opções. Parcelamento sem entrada (“Em 0Nx de R$ valor÷N”); use 1 parcela para “à vista”."
        acoes={
          linhas.length < 4 ? (
            <button
              type="button"
              onClick={addLinha}
              className="hj-btn hj-btn-secondary hj-btn-sm"
            >
              <IconPlus />
              Adicionar opção
            </button>
          ) : null
        }
      >
        <div className="flex flex-col gap-3">
          {linhas.map((l, i) => {
            const valorN = Number(l.valor.replace(",", ".")) || 0;
            const parcelasN = Math.trunc(Number(l.parcelas) || 0);
            return (
              <div
                key={i}
                className="flex flex-wrap items-end gap-4 rounded-lg border border-ink-200 bg-ink-50/50 p-4"
              >
                <span className="mb-2 inline-flex size-7 items-center justify-center rounded-full bg-navy-800 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <div className="w-40">
                  <Field label="Valor por unidade (R$)">
                    <TextInput
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.valor}
                      onChange={(e) => setLinha(i, { valor: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="w-32">
                  <Field label="Nº de parcelas">
                    <TextInput
                      type="number"
                      min="1"
                      step="1"
                      value={l.parcelas}
                      onChange={(e) => setLinha(i, { parcelas: e.target.value })}
                    />
                  </Field>
                </div>
                <span className="mb-2 flex-1 text-sm font-medium text-brand-700">
                  {valorN > 0
                    ? textoFormaTss({ valor: valorN, parcelas: parcelasN })
                    : "—"}
                </span>
                {linhas.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => rmLinha(i)}
                    aria-label={`Remover opção ${i + 1}`}
                    className="mb-1 rounded-lg p-2 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <IconTrash className="size-4" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-baseline gap-3 rounded-lg bg-navy-900 px-5 py-4">
          <span className="text-xs font-semibold tracking-wide text-brand-200 uppercase">
            Total à vista (registrado)
          </span>
          <span className="text-lg font-semibold text-white tabular-nums">
            {formatBRL(snapshot)}
          </span>
        </div>
      </Card>

      {state.ok ? <FormSuccess message={state.mensagem ?? "Salvo."} /> : null}
      <FormError message={state.error} />

      <div className="flex justify-end">
        <SubmitButton icone={<IconCheck />}>Salvar TSS Light</SubmitButton>
      </div>
    </form>
  );
}
