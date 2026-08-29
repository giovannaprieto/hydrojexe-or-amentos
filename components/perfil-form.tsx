"use client";

import { useActionState } from "react";

import { trocarSenha } from "@/app/(app)/perfil/actions";
import { IconCheck } from "@/components/icons";
import {
  Field,
  FormError,
  FormSuccess,
  SubmitButton,
  TextInput,
} from "@/components/ui";
import { Card } from "@/components/ui-layout";
import { emptyFormState } from "@/lib/forms";

export function PerfilForm() {
  const [state, formAction] = useActionState(trocarSenha, emptyFormState);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-5">
      <Card titulo="Alterar senha">
        <div className="flex flex-col gap-5">
          <Field label="Nova senha *">
            <TextInput
              type="password"
              name="senha"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirmar nova senha *">
            <TextInput
              type="password"
              name="confirmar"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </Field>
          {state.ok ? (
            <FormSuccess message={state.mensagem ?? "Senha alterada."} />
          ) : null}
          <FormError message={state.error} />
        </div>
      </Card>

      <div className="flex justify-end">
        <SubmitButton icone={<IconCheck />}>Salvar</SubmitButton>
      </div>
    </form>
  );
}
