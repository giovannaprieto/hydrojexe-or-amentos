"use client";

import { useActionState } from "react";

import {
  atualizarForma,
  criarForma,
} from "@/app/(app)/admin/formas-pagamento/actions";
import { IconCheck, IconPlus } from "@/components/icons";
import {
  Checkbox,
  Field,
  FormError,
  FormSuccess,
  Select,
  SubmitButton,
  TextInput,
} from "@/components/ui";
import { Card } from "@/components/ui-layout";
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
    <form action={formAction} className="flex max-w-3xl flex-col gap-5">
      {inicial ? <input type="hidden" name="id" value={inicial.id} /> : null}

      <Card>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nome *">
            <TextInput name="nome" required defaultValue={inicial?.nome ?? ""} />
          </Field>
          <Field label="Slug" hint="Em branco: gera a partir do nome.">
            <TextInput name="slug" defaultValue={inicial?.slug ?? ""} />
          </Field>

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

          <div className="sm:col-span-2">
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
          </div>

          <div className="sm:col-span-2">
            <Checkbox
              name="ativo"
              label="Ativa"
              defaultChecked={inicial?.ativo ?? true}
            />
          </div>
        </div>
      </Card>

      {state.ok ? <FormSuccess message="Salvo." /> : null}
      <FormError message={state.error} />

      <div className="flex justify-end">
        <SubmitButton icone={editando ? <IconCheck /> : <IconPlus />}>
          {editando ? "Salvar" : "Adicionar forma"}
        </SubmitButton>
      </div>
    </form>
  );
}
