"use client";

import { useActionState } from "react";

import { atualizarItem, criarItem } from "@/app/(app)/admin/itens/actions";
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
import type { Tables } from "@/types/database";

type Item = Tables<"itens_precificaveis">;

export function ItemForm({ inicial }: { inicial?: Item }) {
  const editando = Boolean(inicial);
  const [state, formAction] = useActionState(
    editando ? atualizarItem : criarItem,
    emptyFormState,
  );

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {inicial ? <input type="hidden" name="id" value={inicial.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome *">
          <TextInput name="nome" required defaultValue={inicial?.nome ?? ""} />
        </Field>
        <Field label="Slug" hint="Deixe em branco para gerar a partir do nome.">
          <TextInput name="slug" defaultValue={inicial?.slug ?? ""} />
        </Field>
      </div>

      <Field label="Descrição">
        <Textarea name="descricao" defaultValue={inicial?.descricao ?? ""} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <Field label="Unidade">
          <Select name="unidade" defaultValue={inicial?.unidade ?? "ponto"}>
            <option value="ponto">ponto</option>
            <option value="valvula">valvula</option>
            <option value="orcamento">orcamento</option>
          </Select>
        </Field>
        <Field label="Ordem">
          <TextInput
            name="ordem"
            type="number"
            defaultValue={String(inicial?.ordem ?? 0)}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <Checkbox
          name="is_tss"
          label="É o item TSS (rateio especial)"
          defaultChecked={inicial?.is_tss ?? false}
        />
        <Checkbox
          name="ativo"
          label="Ativo"
          defaultChecked={inicial?.ativo ?? true}
        />
      </div>

      {state.ok ? (
        <p className="text-sm text-green-700 dark:text-green-400">Salvo.</p>
      ) : null}
      <FormError message={state.error} />

      <SubmitButton>{editando ? "Salvar" : "Adicionar item"}</SubmitButton>
    </form>
  );
}
