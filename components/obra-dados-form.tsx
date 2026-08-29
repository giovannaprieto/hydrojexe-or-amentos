"use client";

import { useActionState } from "react";

import { salvarObra } from "@/app/(app)/obras/actions";
import { IconCheck } from "@/components/icons";
import {
  Field,
  FormError,
  FormSuccess,
  Select,
  SubmitButton,
  TextInput,
  Textarea,
} from "@/components/ui";
import { emptyFormState } from "@/lib/forms";
import { STATUS_OBRA } from "@/lib/obras";

export type ObraDadosInicial = {
  id: string;
  status: string;
  previsao_inicio: string | null;
  previsao_fim: string | null;
  outros_custos: number;
  observacoes: string | null;
};

export function ObraDadosForm({ inicial }: { inicial: ObraDadosInicial }) {
  const [state, formAction] = useActionState(salvarObra, emptyFormState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="id" value={inicial.id} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Status">
          <Select name="status" defaultValue={inicial.status}>
            {STATUS_OBRA.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.rotulo}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Outros custos (mão de obra etc.) — R$">
          <TextInput
            type="number"
            min="0"
            step="0.01"
            name="outros_custos"
            defaultValue={String(inicial.outros_custos)}
          />
        </Field>
        <Field label="Previsão de início">
          <TextInput
            type="date"
            name="previsao_inicio"
            defaultValue={inicial.previsao_inicio ?? ""}
          />
        </Field>
        <Field label="Previsão de término">
          <TextInput
            type="date"
            name="previsao_fim"
            defaultValue={inicial.previsao_fim ?? ""}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Observações">
            <Textarea
              name="observacoes"
              defaultValue={inicial.observacoes ?? ""}
            />
          </Field>
        </div>
      </div>

      {state.ok ? <FormSuccess message={state.mensagem ?? "Salvo."} /> : null}
      <FormError message={state.error} />
      <div className="flex justify-end">
        <SubmitButton icone={<IconCheck />}>Salvar dados da obra</SubmitButton>
      </div>
    </form>
  );
}
