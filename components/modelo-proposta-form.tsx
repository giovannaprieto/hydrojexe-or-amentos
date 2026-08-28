"use client";

import { useActionState, useState } from "react";

import { salvarModeloProposta } from "@/app/(app)/admin/textos/actions";
import { FormError, SubmitButton, TextInput, Textarea } from "@/components/ui";
import { emptyFormState } from "@/lib/forms";
import type { SecaoModelo } from "@/lib/modelos-proposta";

export function ModeloPropostaForm({
  tipo,
  nome,
  secoesIniciais,
  usandoOverride,
  introLabel,
  introInicial,
}: {
  tipo: string;
  nome: string;
  secoesIniciais: SecaoModelo[];
  usandoOverride: boolean;
  /** se definido, mostra um campo de texto de abertura (antes das seções) */
  introLabel?: string;
  introInicial?: string;
}) {
  const [state, formAction] = useActionState(
    salvarModeloProposta,
    emptyFormState,
  );
  const [secoes, setSecoes] = useState<SecaoModelo[]>(
    secoesIniciais.length > 0
      ? secoesIniciais
      : [{ titulo: "", corpo: "" }],
  );

  const patch = (i: number, p: Partial<SecaoModelo>) =>
    setSecoes((ls) => ls.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const add = () => setSecoes((ls) => [...ls, { titulo: "", corpo: "" }]);
  const rm = (i: number) => setSecoes((ls) => ls.filter((_, j) => j !== i));

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 dark:border-white/10"
    >
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="secoes" value={JSON.stringify(secoes)} />

      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{nome}</h3>
        <span className="text-xs text-black/50 dark:text-white/50">
          {usandoOverride
            ? "editado (sobrescreve o padrão)"
            : "usando texto padrão do sistema"}
        </span>
      </div>

      {introLabel ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{introLabel}</span>
          <Textarea name="intro" rows={4} defaultValue={introInicial ?? ""} />
        </label>
      ) : null}

      {secoes.map((s, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 rounded-md border border-black/10 p-3 dark:border-white/10"
        >
          <div className="flex items-center gap-2">
            <TextInput
              placeholder="Título da seção"
              value={s.titulo}
              onChange={(e) => patch(i, { titulo: e.target.value })}
            />
            {secoes.length > 1 ? (
              <button
                type="button"
                onClick={() => rm(i)}
                className="shrink-0 text-sm text-red-600 hover:underline dark:text-red-400"
              >
                remover
              </button>
            ) : null}
          </div>
          <Textarea
            placeholder="Corpo da seção"
            rows={5}
            value={s.corpo}
            onChange={(e) => patch(i, { corpo: e.target.value })}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="self-start text-sm text-black/70 hover:underline dark:text-white/70"
      >
        + adicionar seção
      </button>

      <p className="text-xs text-black/50 dark:text-white/50">
        Para voltar ao texto padrão do sistema, remova todas as seções e salve.
      </p>

      {state.ok ? (
        <p className="text-sm text-green-700 dark:text-green-400">
          {state.mensagem ?? "Salvo."}
        </p>
      ) : null}
      <FormError message={state.error} />
      <SubmitButton>Salvar “{nome}”</SubmitButton>
    </form>
  );
}
