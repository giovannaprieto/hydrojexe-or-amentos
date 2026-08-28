"use client";

import { useActionState, useState } from "react";

import { salvarGestaoMensal } from "@/app/(app)/orcamentos/actions";
import { Field, FormError, SubmitButton, TextInput } from "@/components/ui";
import { formatBRL } from "@/lib/format";
import { emptyFormState } from "@/lib/forms";

export type GestaoMensalInicial = {
  id: string;
  sistema: string; // "água" | "gás"
  ponto: string; // "hidrômetro" | "gasômetro"
  qtd_apartamentos: number;
  pontos_por_apartamento: number;
  valor_por_apartamento: number;
};

export function GestaoMensalForm({ inicial }: { inicial: GestaoMensalInicial }) {
  const [state, formAction] = useActionState(
    salvarGestaoMensal,
    emptyFormState,
  );

  const [qtd, setQtd] = useState(String(inicial.qtd_apartamentos || ""));
  const [pontos, setPontos] = useState(
    String(inicial.pontos_por_apartamento || 1),
  );
  const [valor, setValor] = useState(
    String(inicial.valor_por_apartamento || ""),
  );

  const nQtd = Number(qtd.replace(",", ".")) || 0;
  const nPontos = Number(pontos.replace(",", ".")) || 0;
  const nValor = Number(valor.replace(",", ".")) || 0;
  const totalPontos = Math.trunc(nQtd) * Math.trunc(nPontos);
  const totalMensal = totalPontos * nValor;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 dark:border-white/10"
    >
      <input type="hidden" name="id" value={inicial.id} />

      <p className="text-sm text-black/60 dark:text-white/60">
        Proposta de <strong>gestão mensal de {inicial.sistema}</strong> (leitura
        visual). Sem tipos de apartamento e sem parcelamento — a cobrança é
        mensal, por {inicial.ponto}.
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
        <Field label={`${inicial.ponto}s por apartamento`}>
          <TextInput
            type="number"
            min="1"
            step="1"
            name="pontos_por_apartamento"
            value={pontos}
            onChange={(e) => setPontos(e.target.value)}
          />
        </Field>
        <Field label="Valor mensal por apartamento (R$) *">
          <TextInput
            type="number"
            min="0"
            step="0.01"
            name="valor_por_apartamento"
            required
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
        </Field>
      </div>

      <div className="rounded-md bg-black/5 px-3 py-2 text-sm dark:bg-white/10">
        Pontos a serem lidos: <strong>{totalPontos || "—"}</strong> · Valor total
        mensal: <strong>{formatBRL(totalMensal)}</strong>
      </div>

      {state.ok ? (
        <p className="text-sm text-green-700 dark:text-green-400">
          {state.mensagem ?? "Salvo."}
        </p>
      ) : null}
      <FormError message={state.error} />
      <SubmitButton>Salvar gestão mensal</SubmitButton>
    </form>
  );
}
