"use client";

import { useActionState } from "react";

import { signIn, type LoginState } from "@/app/login/actions";
import { Field, TextInput } from "@/components/ui";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <Field label="E-mail">
        <TextInput
          type="email"
          name="email"
          required
          autoComplete="email"
          autoFocus
          placeholder="voce@hydrojexe.com.br"
        />
      </Field>

      <Field label="Senha">
        <TextInput
          type="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </Field>

      {state.error ? (
        <p className="hj-alert hj-alert-error">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="hj-btn hj-btn-primary w-full py-2.5"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
