"use client";

import { useActionState } from "react";

import { aplicarNovaTabela } from "@/app/(app)/admin/precos/actions";
import { IconCheck } from "@/components/icons";
import {
  Field,
  FormError,
  FormSuccess,
  SubmitButton,
  TextInput,
} from "@/components/ui";
import { Card, TableWrap } from "@/components/ui-layout";
import { emptyFormState } from "@/lib/forms";

type Opcao = { id: string; nome: string };

export function NovaTabelaPrecos({
  hoje,
  itens,
  formas,
  atuais,
}: {
  hoje: string;
  itens: Opcao[];
  formas: Opcao[];
  atuais: Record<string, number>;
}) {
  const [state, formAction] = useActionState(aplicarNovaTabela, emptyFormState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Card>
        <div className="w-52">
          <Field label="Vigência a partir de">
            <TextInput
              type="date"
              name="vigencia_inicio"
              defaultValue={hoje}
              required
            />
          </Field>
        </div>
      </Card>

      <Card plano>
        <TableWrap>
          <thead>
            <tr>
              <th>Item</th>
              {formas.map((f) => (
                <th key={f.id} className="text-right">
                  {f.nome}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.id}>
                <td className="font-medium whitespace-nowrap text-navy-900">
                  {i.nome}
                </td>
                {formas.map((f) => (
                  <td key={f.id} className="py-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      name={`valor__${i.id}__${f.id}`}
                      defaultValue={atuais[`${i.id}__${f.id}`] ?? ""}
                      className="hj-control ml-auto w-28 py-1.5 text-right tabular-nums"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>

      {state.ok ? (
        <FormSuccess message={state.mensagem ?? "Nova tabela aplicada."} />
      ) : null}
      <FormError message={state.error} />

      <div className="flex justify-end">
        <SubmitButton pendingLabel="Aplicando…" icone={<IconCheck />}>
          Aplicar nova tabela
        </SubmitButton>
      </div>
    </form>
  );
}
