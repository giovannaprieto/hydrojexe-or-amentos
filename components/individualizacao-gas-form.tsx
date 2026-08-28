"use client";

import { useActionState, useState } from "react";

import { salvarIndividualizacaoGas } from "@/app/(app)/orcamentos/actions";
import { Field, FormError, SubmitButton, TextInput } from "@/components/ui";
import { formatBRL } from "@/lib/format";
import { emptyFormState } from "@/lib/forms";
import { textoFormaParcelas } from "@/lib/modelos-proposta";

type Linha = { valor: string; parcelas: string };

export type IndividualizacaoGasInicial = {
  id: string;
  qtd_apartamentos: number;
  pontos_por_apartamento: number;
  valor_gerenciamento: number;
  opcoes: { valor: number; parcelas: number }[];
};

export function IndividualizacaoGasForm({
  inicial,
}: {
  inicial: IndividualizacaoGasInicial;
}) {
  const [state, formAction] = useActionState(
    salvarIndividualizacaoGas,
    emptyFormState,
  );

  const [qtd, setQtd] = useState(String(inicial.qtd_apartamentos || ""));
  const [pontos, setPontos] = useState(
    String(inicial.pontos_por_apartamento || 1),
  );
  const [ger, setGer] = useState(String(inicial.valor_gerenciamento || ""));
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
  const totalMedidores =
    (Math.trunc(Number(qtd.replace(",", ".")) || 0)) *
    (Math.trunc(Number(pontos.replace(",", ".")) || 0));
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
        <strong>Individualização de gás</strong> (instalação de gasômetros por
        telemetria). Até 4 opções de investimento — parcelamento sem entrada
        (“Em 0N parcelas de R$ valor÷N”); use <strong>1</strong> parcela para “à
        vista”.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Qtd. de apartamentos *">
          <TextInput
            type="number"
            min="1"
            step="1"
            name="qtd_apartamentos"
            required
            value={qtd}
            onChange={(e) => setQtd(e.target.value)}
          />
        </Field>
        <Field label="Medidores por apartamento">
          <TextInput
            type="number"
            min="1"
            step="1"
            name="pontos_por_apartamento"
            value={pontos}
            onChange={(e) => setPontos(e.target.value)}
          />
        </Field>
        <Field label="Gerenciamento mensal (R$/gasômetro)">
          <TextInput
            type="number"
            min="0"
            step="0.01"
            name="valor_gerenciamento"
            value={ger}
            onChange={(e) => setGer(e.target.value)}
          />
        </Field>
      </div>

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
              <Field label="Valor por apartamento (R$)">
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
                  ? textoFormaParcelas({ valor: valorN, parcelas: parcelasN })
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
        Pontos a serem instalados: <strong>{totalMedidores || "—"}</strong> ·
        Snapshot (Total à vista): <strong>{formatBRL(snapshot)}</strong>
      </div>

      {state.ok ? (
        <p className="text-sm text-green-700 dark:text-green-400">
          {state.mensagem ?? "Salvo."}
        </p>
      ) : null}
      <FormError message={state.error} />
      <SubmitButton>Salvar individualização de gás</SubmitButton>
    </form>
  );
}
