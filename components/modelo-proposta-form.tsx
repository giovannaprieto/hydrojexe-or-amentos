"use client";

import { useActionState, useState } from "react";

import { salvarModeloProposta } from "@/app/(app)/admin/textos/actions";
import { IconCheck, IconPlus, IconTrash } from "@/components/icons";
import {
  FormError,
  FormSuccess,
  SubmitButton,
  TextInput,
  Textarea,
} from "@/components/ui";
import { Badge } from "@/components/ui-layout";
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
    <form action={formAction} className="hj-card flex flex-col">
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="secoes" value={JSON.stringify(secoes)} />

      <div className="hj-card-header">
        <h3 className="hj-card-title">{nome}</h3>
        <Badge tom={usandoOverride ? "info" : "neutral"}>
          {usandoOverride ? "Editado" : "Texto padrão do sistema"}
        </Badge>
      </div>

      <div className="flex flex-col gap-4 hj-card-pad">
        {introLabel ? (
          <label className="flex flex-col gap-1.5">
            <span className="hj-field-label">{introLabel}</span>
            <Textarea name="intro" rows={4} defaultValue={introInicial ?? ""} />
          </label>
        ) : null}

        {secoes.map((s, i) => (
          <div
            key={i}
            className="flex flex-col gap-2.5 rounded-lg border border-ink-200 bg-ink-50/50 p-4"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-navy-800 text-[0.7rem] font-semibold text-white">
                {i + 1}
              </span>
              <TextInput
                placeholder="Título da seção"
                value={s.titulo}
                onChange={(e) => patch(i, { titulo: e.target.value })}
              />
              {secoes.length > 1 ? (
                <button
                  type="button"
                  onClick={() => rm(i)}
                  aria-label={`Remover seção ${i + 1}`}
                  className="shrink-0 rounded-lg p-2 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <IconTrash className="size-4" />
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
          className="hj-btn hj-btn-secondary hj-btn-sm w-fit"
        >
          <IconPlus />
          Adicionar seção
        </button>

        <p className="hj-hint">
          Para voltar ao texto padrão do sistema, remova todas as seções e
          salve.
        </p>

        {state.ok ? (
          <FormSuccess message={state.mensagem ?? "Salvo."} />
        ) : null}
        <FormError message={state.error} />

        <div className="flex justify-end">
          <SubmitButton icone={<IconCheck />}>Salvar “{nome}”</SubmitButton>
        </div>
      </div>
    </form>
  );
}
