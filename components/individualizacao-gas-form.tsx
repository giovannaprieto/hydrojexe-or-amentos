"use client";

import { useActionState, useState } from "react";

import { salvarIndividualizacaoGas } from "@/app/(app)/orcamentos/actions";
import { IconCheck } from "@/components/icons";
import {
  Field,
  FormError,
  FormSuccess,
  Select,
  SubmitButton,
  TextInput,
} from "@/components/ui";
import { Card, TableWrap } from "@/components/ui-layout";
import { formatBRL } from "@/lib/format";
import { emptyFormState } from "@/lib/forms";
import { textoFormaParcelas } from "@/lib/modelos-proposta";
import { MEDIDORES_GAS } from "@/lib/orcamento-especificacoes";

type PrecoForma = { nome: string; num_parcelas: number; valorUnit: number };

export type IndividualizacaoGasInicial = {
  id: string;
  qtd_apartamentos: number;
  pontos_por_apartamento: number;
  valor_gerenciamento: number;
  medidor_gas: string | null;
};

export function IndividualizacaoGasForm({
  inicial,
  precoPorMedidor,
}: {
  inicial: IndividualizacaoGasInicial;
  /** preço unitário vigente do medidor, por forma de pagamento (à vista, 6x…) */
  precoPorMedidor: Record<string, PrecoForma[]>;
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
  const [medidor, setMedidor] = useState(inicial.medidor_gas ?? "gas_1_6");

  const nPontos = Math.trunc(Number(pontos.replace(",", ".")) || 0);
  const totalMedidores =
    Math.trunc(Number(qtd.replace(",", ".")) || 0) * nPontos;

  // preview das 4 opções, calculado como no salvamento
  const formas = precoPorMedidor[medidor] ?? [];
  const opcoes = formas.map((f) => ({
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
        descricao="Instalação de gasômetros por telemetria. As opções de investimento saem da tabela de preços."
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
              hint="Define o preço na tabela e a vazão nominal citada no Procedimento executivo do PDF."
            >
              <Select
                name="medidor_gas"
                value={medidor}
                onChange={(e) => setMedidor(e.target.value)}
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
        descricao="Calculadas pela tabela de preços — preço do medidor por forma × medidores por apartamento. Ao salvar, os valores são congelados no orçamento."
      >
        {semPreco ? (
          <p className="hj-alert hj-alert-warn">
            Sem preço vigente para este medidor na tabela de preços. Cadastre os
            valores em <strong>Tabela de preços</strong> antes de salvar.
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
                    {formatBRL(formas[i]?.valorUnit ?? 0)}
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
