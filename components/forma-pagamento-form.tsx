"use client";

import { useActionState } from "react";

import {
  atualizarForma,
  criarForma,
} from "@/app/(app)/admin/formas-pagamento/actions";
import {
  Checkbox,
  Field,
  FormError,
  Select,
  SubmitButton,
  TextInput,
} from "@/components/ui";
import { emptyFormState } from "@/lib/forms";
import type { Tables } from "@/types/database";

type Forma = Tables<"formas_pagamento">;
type Opcao = Pick<Forma, "id" | "nome">;

export function FormaPagamentoForm({
  inicial,
  opcoes,
}: {
  inicial?: Forma;
  opcoes: Opcao[];
}) {
  const editando = Boolean(inicial);
  const [state, formAction] = useActionState(
    editando ? atualizarForma : criarForma,
    emptyFormState,
  );

  const outras = opcoes.filter((o) => o.id !== inicial?.id);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {inicial ? <input type="hidden" name="id" value={inicial.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome *">
          <TextInput name="nome" required defaultValue={inicial?.nome ?? ""} />
        </Field>
        <Field label="Slug" hint="Em branco: gera a partir do nome.">
          <TextInput name="slug" defaultValue={inicial?.slug ?? ""} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-[8rem_8rem]">
        <Field label="Nº de parcelas">
          <TextInput
            name="num_parcelas"
            type="number"
            min={1}
            defaultValue={String(inicial?.num_parcelas ?? 1)}
          />
        </Field>
        <Field label="Ordem">
          <TextInput
            name="ordem"
            type="number"
            defaultValue={String(inicial?.ordem ?? 0)}
          />
        </Field>
      </div>

      <Field
        label="Usa preço de"
        hint="Ex.: 24x reaproveita os preços de 12x. Em branco = preço próprio."
      >
        <Select
          name="usa_preco_de_forma_id"
          defaultValue={inicial?.usa_preco_de_forma_id ?? ""}
        >
          <option value="">— preço próprio —</option>
          {outras.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </Select>
      </Field>

      <Checkbox
        name="ativo"
        label="Ativa"
        defaultChecked={inicial?.ativo ?? true}
      />

      {state.ok ? (
        <p className="text-sm text-green-700 dark:text-green-400">Salvo.</p>
      ) : null}
      <FormError message={state.error} />

      <SubmitButton>{editando ? "Salvar" : "Adicionar forma"}</SubmitButton>
    </form>
  );
}
