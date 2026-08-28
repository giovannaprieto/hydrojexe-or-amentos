"use client";

import { useActionState } from "react";

import {
  criarUsuario,
  type CriarUsuarioState,
} from "@/app/(app)/admin/usuarios/actions";
import { IconPlus } from "@/components/icons";
import { Field, Select, TextInput } from "@/components/ui";
import { Card } from "@/components/ui-layout";

const initialState: CriarUsuarioState = {
  ok: false,
  error: null,
  mensagem: null,
};

export function CriarUsuarioForm() {
  const [state, formAction, pending] = useActionState(
    criarUsuario,
    initialState,
  );

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      <Card>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nome *">
            <TextInput name="nome" required />
          </Field>
          <Field label="E-mail *">
            <TextInput name="email" type="email" required />
          </Field>
          <Field
            label="Senha provisória *"
            hint="Mínimo 8 caracteres. O usuário pode trocar depois."
          >
            <TextInput name="senha" type="text" minLength={8} required />
          </Field>
          <Field label="Perfil">
            <Select name="perfil" defaultValue="comercial">
              <option value="comercial">Comercial</option>
              <option value="admin">Administrador</option>
            </Select>
          </Field>
        </div>
      </Card>

      {state.error ? (
        <p className="hj-alert hj-alert-error">{state.error}</p>
      ) : null}
      {state.ok && state.mensagem ? (
        <p className="hj-alert hj-alert-success">{state.mensagem}</p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="hj-btn hj-btn-primary"
        >
          {pending ? null : <IconPlus />}
          {pending ? "Criando…" : "Criar usuário"}
        </button>
      </div>
    </form>
  );
}
