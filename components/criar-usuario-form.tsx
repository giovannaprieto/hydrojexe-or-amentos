"use client";

import { useActionState } from "react";

import {
  criarUsuario,
  type CriarUsuarioState,
} from "@/app/(app)/admin/usuarios/actions";

const initialState: CriarUsuarioState = { ok: false, error: null, mensagem: null };

const inputClass =
  "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50";

export function CriarUsuarioForm() {
  const [state, formAction, pending] = useActionState(criarUsuario, initialState);

  return (
    <form
      action={formAction}
      className="flex max-w-md flex-col gap-4 rounded-lg border border-black/10 p-4 dark:border-white/10"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Nome</span>
        <input name="nome" required className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">E-mail</span>
        <input name="email" type="email" required className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Senha provisória</span>
        <input
          name="senha"
          type="text"
          minLength={8}
          required
          className={inputClass}
        />
        <span className="text-xs text-black/50 dark:text-white/50">
          Mínimo 8 caracteres. O usuário pode trocar depois.
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Perfil</span>
        <select name="perfil" defaultValue="comercial" className={inputClass}>
          <option value="comercial">Comercial</option>
          <option value="admin">Administrador</option>
        </select>
      </label>

      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      {state.ok && state.mensagem ? (
        <p className="text-sm text-green-700 dark:text-green-400">{state.mensagem}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity disabled:opacity-60"
      >
        {pending ? "Criando…" : "Criar usuário"}
      </button>
    </form>
  );
}
