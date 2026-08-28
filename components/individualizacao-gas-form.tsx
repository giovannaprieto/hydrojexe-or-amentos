"use client";

import { useActionState, useState } from "react";

import { salvarIndividualizacaoGas } from "@/app/(app)/orcamentos/actions";
import { IconCheck, IconPlus, IconTrash } from "@/components/icons";
import {
  Field,
  FormError,
  FormSuccess,
  Select,
  SubmitButton,
  TextInput,
} from "@/components/ui";
import { Card } from "@/components/ui-layout";
import { formatBRL } from "@/lib/format";
import { emptyFormState } from "@/lib/forms";
import { textoFormaParcelas } from "@/lib/modelos-proposta";
import { MEDIDORES_GAS } from "@/lib/orcamento-especificacoes";

type Linha = { valor: string; parcelas: string };

export type IndividualizacaoGasInicial = {
  id: string;
  qtd_apartamentos: number;
  pontos_por_apartamento: number;
  valor_gerenciamento: number;
  medidor_gas: string | null;
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
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="id" value={inicial.id} />
      <input type="hidden" name="opcoes" value={opcoesJson} />

      <Card
        titulo="Instalação"
        descricao="Instalação de gasômetros por telemetria."
      >
        <div className="grid gap-5 sm:grid-cols-3">
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
        <div className="sm:col-span-3">
          <Field
            label="Medidor de gás"
            hint="Define a vazão nominal citada no Procedimento executivo do PDF."
          >
            <Select
              name="medidor_gas"
              defaultValue={inicial.medidor_gas ?? "gas_1_6"}
            >
              {MEDIDORES_GAS.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.rotulo}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        </div>
      </Card>

      <Card
        titulo="Opções de investimento"
        descricao="Até 4 opções. Parcelamento sem entrada (“Em 0N parcelas de R$ valor÷N”); use 1 parcela para “à vista”."
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
                <div className="w-44">
                  <Field label="Valor por apartamento (R$)">
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
                    ? textoFormaParcelas({ valor: valorN, parcelas: parcelasN })
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

        <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg bg-navy-900 px-5 py-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-brand-200 uppercase">
              Pontos a serem instalados
            </p>
            <p className="text-lg font-semibold text-white tabular-nums">
              {totalMedidores || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-brand-200 uppercase">
              Total à vista (registrado)
            </p>
            <p className="text-lg font-semibold text-white tabular-nums">
              {formatBRL(snapshot)}
            </p>
          </div>
        </div>
      </Card>

      {state.ok ? <FormSuccess message={state.mensagem ?? "Salvo."} /> : null}
      <FormError message={state.error} />

      <div className="flex justify-end">
        <SubmitButton icone={<IconCheck />}>
          Salvar individualização de gás
        </SubmitButton>
      </div>
    </form>
  );
}
