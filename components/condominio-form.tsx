"use client";

import { useActionState } from "react";

import {
  atualizarCondominio,
  criarCondominio,
} from "@/app/(app)/condominios/actions";
import { IconCheck, IconPlus } from "@/components/icons";
import {
  Checkbox,
  Field,
  FormError,
  FormSuccess,
  SubmitButton,
  TextInput,
  Textarea,
} from "@/components/ui";
import { Card } from "@/components/ui-layout";
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
    <form action={formAction} className="flex max-w-3xl flex-col gap-5">
      {inicial ? <input type="hidden" name="id" value={inicial.id} /> : null}

      <Card
        titulo="Identificação"
        descricao="Nome e dados que aparecem no cabeçalho da proposta."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Nome *">
              <TextInput
                name="nome"
                required
                defaultValue={inicial?.nome ?? ""}
              />
            </Field>
          </div>
          <Field label="CNPJ">
            <TextInput name="cnpj" defaultValue={inicial?.cnpj ?? ""} />
          </Field>
          <Field label="Qtd. de unidades">
            <TextInput
              type="number"
              min="1"
              step="1"
              name="qtd_unidades"
              defaultValue={
                inicial?.qtd_unidades != null ? String(inicial.qtd_unidades) : ""
              }
            />
          </Field>
          <Field label="Síndico">
            <TextInput
              name="sindico_nome"
              defaultValue={inicial?.sindico_nome ?? ""}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Administradora">
              <TextInput
                name="administradora"
                defaultValue={inicial?.administradora ?? ""}
              />
            </Field>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Checkbox
              name="agua_preparado"
              label="Prédio preparado para individualização de água"
              defaultChecked={inicial?.agua_preparado ?? false}
            />
            <span className="hj-hint">
              Preparado = tubulações já individualizadas em shafts. Muda a
              “Análise técnica” do PDF de individualização de água.
            </span>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Checkbox
              name="parcelamento_especial"
              label="Parcelamento especial"
              defaultChecked={inicial?.parcelamento_especial ?? false}
            />
            <span className="hj-hint">
              No PDF deste condomínio: 9x usa o preço de 6x, 12x usa o de 9x e
              24x usa o de 12x. À vista e 6x não mudam.
            </span>
          </div>
        </div>
      </Card>

      <Card titulo="Endereço">
        <div className="grid gap-5 sm:grid-cols-[1fr_1fr_6rem]">
          <div className="sm:col-span-3">
            <Field label="Endereço">
              <TextInput
                name="endereco"
                defaultValue={inicial?.endereco ?? ""}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Cidade">
              <TextInput name="cidade" defaultValue={inicial?.cidade ?? ""} />
            </Field>
          </div>
          <Field label="UF">
            <TextInput name="uf" maxLength={2} defaultValue={inicial?.uf ?? ""} />
          </Field>
        </div>
      </Card>

      <Card titulo="Contato">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nome">
            <TextInput
              name="contato_nome"
              defaultValue={inicial?.contato_nome ?? ""}
            />
          </Field>
          <Field label="Telefone">
            <TextInput
              name="contato_telefone"
              defaultValue={inicial?.contato_telefone ?? ""}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="E-mail">
              <TextInput
                name="contato_email"
                type="email"
                defaultValue={inicial?.contato_email ?? ""}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Observações">
              <Textarea
                name="observacoes"
                defaultValue={inicial?.observacoes ?? ""}
              />
            </Field>
          </div>
        </div>
      </Card>

      {state.ok ? <FormSuccess message="Alterações salvas." /> : null}
      <FormError message={state.error} />

      <div className="flex justify-end">
        <SubmitButton icone={editando ? <IconCheck /> : <IconPlus />}>
          {editando ? "Salvar alterações" : "Criar condomínio"}
        </SubmitButton>
      </div>
    </form>
  );
}
