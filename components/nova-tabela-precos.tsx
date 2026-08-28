"use client";

import { useActionState } from "react";

import { aplicarNovaTabela } from "@/app/(app)/admin/precos/actions";
import { Field, FormError, SubmitButton, TextInput } from "@/components/ui";
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
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Vigência a partir de">
        <TextInput
          type="date"
          name="vigencia_inicio"
          defaultValue={hoje}
          required
          className="w-44"
        />
      </Field>

      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 text-black/60 dark:border-white/10 dark:text-white/60">
            <tr>
              <th className="px-3 py-2 font-medium">Item</th>
              {formas.map((f) => (
                <th key={f.id} className="px-3 py-2 text-right font-medium">
                  {f.nome}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <tr
                key={i.id}
                className="border-b border-black/5 last:border-0 dark:border-white/5"
              >
                <td className="whitespace-nowrap px-3 py-1.5">{i.nome}</td>
                {formas.map((f) => (
                  <td key={f.id} className="px-2 py-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      name={`valor__${i.id}__${f.id}`}
                      defaultValue={atuais[`${i.id}__${f.id}`] ?? ""}
                      className="w-28 rounded-md border border-black/15 bg-transparent px-2 py-1 text-right text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {state.ok ? (
        <p className="text-sm text-green-700 dark:text-green-400">
          {state.mensagem ?? "Nova tabela aplicada."}
        </p>
      ) : null}
      <FormError message={state.error} />

      <SubmitButton pendingLabel="Aplicando…">Aplicar nova tabela</SubmitButton>
    </form>
  );
}
