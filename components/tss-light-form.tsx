"use client";

import { useActionState, useState } from "react";

import { salvarTssLight } from "@/app/(app)/orcamentos/actions";
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
import { textoFormaTss } from "@/lib/modelos-proposta";

type PrecoForma = { nome: string; num_parcelas: number; valorUnit: number };

export type TssLightInicial = {
  id: string;
  qtd_equipamentos: number;
};

export function TssLightForm({
  inicial,
  precoTss,
}: {
  inicial: TssLightInicial;
  /** preço unitário vigente do item "TSS", por forma de pagamento */
  precoTss: PrecoForma[];
}) {
  const [state, formAction] = useActionState(salvarTssLight, emptyFormState);

  const [qtd, setQtd] = useState(String(inicial.qtd_equipamentos || 1));

  // preview das opções, calculado como no salvamento
  const opcoes = precoTss.map((f) => ({
    nome: f.nome,
    parcelas: f.num_parcelas,
    valor: Math.round(f.valorUnit * 100) / 100,
  }));
  const semPreco = opcoes.length === 0 || opcoes.every((o) => o.valor <= 0);
  const snapshot =
    opcoes.find((o) => o.parcelas <= 1)?.valor ?? opcoes[0]?.valor ?? 0;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="id" value={inicial.id} />

      <Card
        titulo="Equipamento"
        descricao="Proposta TSS Light — sem tipos de apartamento. As opções de investimento saem da tabela de preços (item TSS)."
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
        descricao="Calculadas pela tabela de preços — preço vigente do item TSS por forma de pagamento. Ao salvar, os valores são congelados no orçamento."
      >
        {semPreco ? (
          <p className="hj-alert hj-alert-warn">
            Sem preço vigente para o item <strong>TSS</strong> na tabela de
            preços. Cadastre os valores em <strong>Tabela de preços</strong> antes
            de salvar.
          </p>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th>Opção</th>
                <th>Forma</th>
                <th className="text-right">Valor por unidade</th>
                <th>No PDF</th>
              </tr>
            </thead>
            <tbody>
              {opcoes.map((o, i) => (
                <tr key={i}>
                  <td className="tabular-nums">{i + 1}</td>
                  <td className="font-medium text-navy-900">{o.nome}</td>
                  <td className="text-right font-medium tabular-nums">
                    {formatBRL(o.valor)}
                  </td>
                  <td className="text-brand-700">
                    {textoFormaTss({ valor: o.valor, parcelas: o.parcelas })}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}

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
