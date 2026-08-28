"use client";

import { useActionState } from "react";

import { atualizarCabecalho } from "@/app/(app)/orcamentos/actions";
import { ParcelasCustom } from "@/components/parcelas-custom";
import {
  Checkbox,
  Field,
  FormError,
  Select,
  SubmitButton,
  TextInput,
  Textarea,
} from "@/components/ui";
import { emptyFormState } from "@/lib/forms";
import { TIPOS_PROPOSTA } from "@/lib/orcamento-tipos";

type Opcao = { id: string; nome: string };

export type CabecalhoInicial = {
  id: string;
  numero: string;
  data_orcamento: string;
  condominio_id: string;
  status: string;
  tipo_proposta: string;
  incluir_tss: boolean;
  parcelas_custom: number[];
  prazo: string | null;
  observacoes: string | null;
  valor_por_hidrometro: number;
};

const STATUS: { valor: string; rotulo: string }[] = [
  { valor: "rascunho", rotulo: "Rascunho" },
  { valor: "enviado", rotulo: "Enviado" },
  { valor: "aprovado", rotulo: "Aprovado" },
  { valor: "recusado", rotulo: "Recusado" },
  { valor: "cancelado", rotulo: "Cancelado" },
];

export function OrcamentoCabecalhoForm({
  inicial,
  condominios,
}: {
  inicial: CabecalhoInicial;
  condominios: Opcao[];
}) {
  const [state, formAction] = useActionState(atualizarCabecalho, emptyFormState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 dark:border-white/10"
    >
      <input type="hidden" name="id" value={inicial.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Número *">
          <TextInput name="numero" required defaultValue={inicial.numero} />
        </Field>
        <Field label="Data *">
          <TextInput
            type="date"
            name="data_orcamento"
            required
            defaultValue={inicial.data_orcamento}
          />
        </Field>
      </div>

      <Field label="Tipo de proposta *">
        <Select name="tipo_proposta" defaultValue={inicial.tipo_proposta}>
          {TIPOS_PROPOSTA.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.rotulo}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Condomínio *">
          <Select
            name="condominio_id"
            required
            defaultValue={inicial.condominio_id}
          >
            {condominios.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={inicial.status}>
            {STATUS.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.rotulo}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Gerenciamento mensal (R$/hidrômetro)">
        <TextInput
          type="number"
          step="0.01"
          min="0"
          name="valor_por_hidrometro"
          defaultValue={String(inicial.valor_por_hidrometro)}
          className="w-40"
        />
      </Field>

      <Checkbox
        name="incluir_tss"
        label="Incluir TSS (rateio por unidade)"
        defaultChecked={inicial.incluir_tss}
      />

      <ParcelasCustom
        name="parcelas_custom"
        inicial={inicial.parcelas_custom}
      />

      <Field label="Prazo">
        <TextInput name="prazo" defaultValue={inicial.prazo ?? ""} />
      </Field>
      <Field label="Observações">
        <Textarea name="observacoes" defaultValue={inicial.observacoes ?? ""} />
      </Field>

      {state.ok ? (
        <p className="text-sm text-green-700 dark:text-green-400">
          {state.mensagem ?? "Salvo."}
        </p>
      ) : null}
      <FormError message={state.error} />
      <SubmitButton>Salvar cabeçalho</SubmitButton>
    </form>
  );
}
