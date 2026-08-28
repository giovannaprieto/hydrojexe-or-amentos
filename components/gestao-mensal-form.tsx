"use client";

import { useActionState, useState } from "react";

import { salvarGestaoMensal } from "@/app/(app)/orcamentos/actions";
import { IconCheck } from "@/components/icons";
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
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="id" value={inicial.id} />

      <Card
        titulo={`Gestão mensal de ${inicial.sistema}`}
        descricao={`Leitura visual. Sem tipos de apartamento e sem parcelamento — a cobrança é mensal, por ${inicial.ponto}.`}
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

        <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg bg-navy-900 px-5 py-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-brand-200 uppercase">
              Pontos a serem lidos
            </p>
            <p className="text-lg font-semibold text-white tabular-nums">
              {totalPontos || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-brand-200 uppercase">
              Valor total mensal
            </p>
            <p className="text-lg font-semibold text-white tabular-nums">
              {formatBRL(totalMensal)}
            </p>
          </div>
        </div>
      </Card>

      {state.ok ? <FormSuccess message={state.mensagem ?? "Salvo."} /> : null}
      <FormError message={state.error} />

      <div className="flex justify-end">
        <SubmitButton icone={<IconCheck />}>Salvar gestão mensal</SubmitButton>
      </div>
    </form>
  );
}
