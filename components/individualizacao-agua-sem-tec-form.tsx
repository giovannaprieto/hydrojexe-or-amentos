"use client";

import { useActionState, useState } from "react";

import { salvarIndividualizacaoAguaSemTec } from "@/app/(app)/orcamentos/actions";
import { IconCheck } from "@/components/icons";
import {
  Field,
  FormError,
  FormSuccess,
  SubmitButton,
  TextInput,
} from "@/components/ui";
import { Card, TableWrap } from "@/components/ui-layout";
import { formatBRL } from "@/lib/format";
import { emptyFormState } from "@/lib/forms";
import { textoFormaParcelas } from "@/lib/modelos-proposta";

type PrecoForma = { nome: string; num_parcelas: number; valorUnit: number };

export type IndividualizacaoAguaSemTecInicial = {
  id: string;
  qtd_apartamentos: number;
  pontos_por_apartamento: number;
  valor_gestao_mensal: number;
};

export function IndividualizacaoAguaSemTecForm({
  inicial,
  precoPorForma,
}: {
  inicial: IndividualizacaoAguaSemTecInicial;
  /** preço unitário vigente do "Hidrômetro Visual", por forma de pagamento */
  precoPorForma: PrecoForma[];
}) {
  const [state, formAction] = useActionState(
    salvarIndividualizacaoAguaSemTec,
    emptyFormState,
  );

  const [qtd, setQtd] = useState(String(inicial.qtd_apartamentos || ""));
  const [pontos, setPontos] = useState(
    String(inicial.pontos_por_apartamento || 1),
  );
  const [ger, setGer] = useState(String(inicial.valor_gestao_mensal || ""));

  const nPontos = Math.trunc(Number(pontos.replace(",", ".")) || 0);
  const totalHidrometros =
    Math.trunc(Number(qtd.replace(",", ".")) || 0) * nPontos;

  const opcoes = precoPorForma.map((f) => ({
    nome: f.nome,
    parcelas: f.num_parcelas,
    valor: Math.round(f.valorUnit * nPontos * 100) / 100,
  }));
  const semPreco = opcoes.length === 0 || opcoes.every((o) => o.valor <= 0);
  const snapshot =
    opcoes.find((o) => o.parcelas <= 1)?.valor ?? opcoes[0]?.valor ?? 0;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="id" value={inicial.id} />

      <Card
        titulo="Instalação"
        descricao="Instalação de hidrômetros visuais (sem tecnologia). As opções de investimento saem da tabela de preços do item “Hidrômetro Visual”."
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
          <Field label="Hidrômetros por apartamento">
            <TextInput
              type="number"
              min="1"
              step="1"
              name="pontos_por_apartamento"
              value={pontos}
              onChange={(e) => setPontos(e.target.value)}
            />
          </Field>
          <Field label="Gestão mensal (R$/apartamento)">
            <TextInput
              type="number"
              min="0"
              step="0.01"
              name="valor_gestao_mensal"
              value={ger}
              onChange={(e) => setGer(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card
        titulo="Opções de investimento"
        descricao="Preço do hidrômetro visual por forma × hidrômetros por apartamento. Ao salvar, os valores são congelados no orçamento."
      >
        {semPreco ? (
          <p className="hj-alert hj-alert-warn">
            Sem preço vigente para o item <strong>Hidrômetro Visual</strong> na
            tabela de preços. Cadastre os valores antes de salvar.
          </p>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th>Opção</th>
                <th>Forma</th>
                <th className="text-right">Preço unit.</th>
                <th className="text-right">Valor por apartamento</th>
                <th>No PDF</th>
              </tr>
            </thead>
            <tbody>
              {opcoes.map((o, i) => (
                <tr key={i}>
                  <td className="tabular-nums">{i + 1}</td>
                  <td className="font-medium text-navy-900">{o.nome}</td>
                  <td className="text-right tabular-nums text-ink-600">
                    {formatBRL(precoPorForma[i]?.valorUnit ?? 0)}
                  </td>
                  <td className="text-right font-medium tabular-nums">
                    {formatBRL(o.valor)}
                  </td>
                  <td className="text-brand-700">
                    {textoFormaParcelas({ valor: o.valor, parcelas: o.parcelas })}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg bg-navy-900 px-5 py-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-brand-200 uppercase">
              Hidrômetros a instalar
            </p>
            <p className="text-lg font-semibold text-white tabular-nums">
              {totalHidrometros || "—"}
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
          Salvar individualização sem tecnologia
        </SubmitButton>
      </div>
    </form>
  );
}
