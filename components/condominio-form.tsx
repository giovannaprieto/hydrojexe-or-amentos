"use client";

import { useActionState } from "react";

import {
  atualizarCondominio,
  criarCondominio,
} from "@/app/(app)/condominios/actions";
import { Field, FormError, SubmitButton, TextInput, Textarea } from "@/components/ui";
import { emptyFormState } from "@/lib/forms";
import type { Tables } from "@/types/database";

type Condominio = Tables<"condominios">;

export function CondominioForm({ inicial }: { inicial?: Condominio }) {
  const editando = Boolean(inicial);
  const [state, formAction] = useActionState(
    editando ? atualizarCondominio : criarCondominio,
    emptyFormState,
  );

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {inicial ? <input type="hidden" name="id" value={inicial.id} /> : null}

      <Field label="Nome *">
        <TextInput name="nome" required defaultValue={inicial?.nome ?? ""} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="CNPJ">
          <TextInput name="cnpj" defaultValue={inicial?.cnpj ?? ""} />
        </Field>
        <Field label="Síndico">
          <TextInput
            name="sindico_nome"
            defaultValue={inicial?.sindico_nome ?? ""}
          />
        </Field>
      </div>

      <Field label="Administradora">
        <TextInput
          name="administradora"
          defaultValue={inicial?.administradora ?? ""}
        />
      </Field>

      <Field label="Endereço">
        <TextInput name="endereco" defaultValue={inicial?.endereco ?? ""} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
        <Field label="Cidade">
          <TextInput name="cidade" defaultValue={inicial?.cidade ?? ""} />
        </Field>
        <Field label="UF">
          <TextInput
            name="uf"
            maxLength={2}
            defaultValue={inicial?.uf ?? ""}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contato (nome)">
          <TextInput
            name="contato_nome"
            defaultValue={inicial?.contato_nome ?? ""}
          />
        </Field>
        <Field label="Contato (telefone)">
          <TextInput
            name="contato_telefone"
            defaultValue={inicial?.contato_telefone ?? ""}
          />
        </Field>
      </div>

      <Field label="Contato (e-mail)">
        <TextInput
          name="contato_email"
          type="email"
          defaultValue={inicial?.contato_email ?? ""}
        />
      </Field>

      <Field label="Observações">
        <Textarea name="observacoes" defaultValue={inicial?.observacoes ?? ""} />
      </Field>

      {state.ok ? (
        <p className="text-sm text-green-700 dark:text-green-400">
          Alterações salvas.
        </p>
      ) : null}
      <FormError message={state.error} />

      <SubmitButton>
        {editando ? "Salvar alterações" : "Criar condomínio"}
      </SubmitButton>
    </form>
  );
}
