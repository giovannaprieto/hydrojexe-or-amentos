"use client";

import { useActionState } from "react";

import { criarOrcamento } from "@/app/(app)/orcamentos/actions";
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

export function OrcamentoNovoForm({
  condominios,
  numeroSugerido,
  hoje,
}: {
  condominios: Opcao[];
  numeroSugerido: string;
  hoje: string;
}) {
  const [state, formAction] = useActionState(criarOrcamento, emptyFormState);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <Field label="Tipo de proposta *">
        <Select name="tipo_proposta" defaultValue="completa">
          {TIPOS_PROPOSTA.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.rotulo}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Condomínio *">
        <Select name="condominio_id" required defaultValue="">
          <option value="" disabled>
            Selecione…
          </option>
          {condominios.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Número *" hint="Sugerido; pode alterar.">
          <TextInput name="numero" required defaultValue={numeroSugerido} />
        </Field>
        <Field label="Data do orçamento *">
          <TextInput type="date" name="data_orcamento" required defaultValue={hoje} />
        </Field>
      </div>

      <Field
        label="Gerenciamento mensal (R$/hidrômetro)"
        hint="Varia por contrato."
      >
        <TextInput
          type="number"
          step="0.01"
          min="0"
          name="valor_por_hidrometro"
          defaultValue="0"
          className="w-40"
        />
      </Field>

      <Checkbox
        name="incluir_tss"
        label="Incluir TSS (rateio por unidade)"
        defaultChecked
      />

      <ParcelasCustom name="parcelas_custom" inicial={[]} />

      <Field label="Prazo">
        <TextInput name="prazo" placeholder="Ex.: 45 dias após aprovação" />
      </Field>

      <Field label="Observações">
        <Textarea name="observacoes" />
      </Field>

      <FormError message={state.error} />
      <SubmitButton pendingLabel="Criando…">Criar e montar</SubmitButton>
    </form>
  );
}
