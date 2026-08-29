"use client";

import { useActionState } from "react";

import { atualizarCabecalho } from "@/app/(app)/orcamentos/actions";
import { FormasPagamentoVisiveis } from "@/components/formas-pagamento-visiveis";
import { IconCheck } from "@/components/icons";
import { ParcelasCustom } from "@/components/parcelas-custom";
import {
  Checkbox,
  Field,
  FormError,
  FormSuccess,
  Select,
  SubmitButton,
  TextInput,
  Textarea,
} from "@/components/ui";
import { Card } from "@/components/ui-layout";
import { emptyFormState } from "@/lib/forms";
import { TIPOS_PROPOSTA } from "@/lib/orcamento-tipos";

type Opcao = { id: string; nome: string };

export type CabecalhoInicial = {
  id: string;
  numero: string;
  data_orcamento: string;
  condominio_id: string;
  status: string;
  tipo_proposta: string;
  incluir_tss: boolean;
  formas_pagamento_visiveis: number[];
  parcelas_custom: number[];
  prazo: string | null;
  observacoes: string | null;
  valor_por_hidrometro: number;
};

const STATUS: { valor: string; rotulo: string }[] = [
  { valor: "rascunho", rotulo: "Rascunho" },
  { valor: "enviado", rotulo: "Enviado" },
  { valor: "aprovado", rotulo: "Aprovado" },
  { valor: "recusado", rotulo: "Recusado" },
  { valor: "cancelado", rotulo: "Cancelado" },
];

export function OrcamentoCabecalhoForm({
  inicial,
  condominios,
}: {
  inicial: CabecalhoInicial;
  condominios: Opcao[];
}) {
  const [state, formAction] = useActionState(atualizarCabecalho, emptyFormState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="id" value={inicial.id} />

      <Card
        titulo="Identificação"
        descricao="Número, data, tipo de proposta e cliente."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Número *">
            <TextInput name="numero" required defaultValue={inicial.numero} />
          </Field>
          <Field label="Data *">
            <TextInput
              type="date"
              name="data_orcamento"
              required
              defaultValue={inicial.data_orcamento}
            />
          </Field>

          <Field label="Tipo de proposta *">
            <Select name="tipo_proposta" defaultValue={inicial.tipo_proposta}>
              {TIPOS_PROPOSTA.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.rotulo}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={inicial.status}>
              {STATUS.map((s) => (
                <option key={s.valor} value={s.valor}>
                  {s.rotulo}
                </option>
              ))}
            </Select>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Condomínio *">
              <Select
                name="condominio_id"
                required
                defaultValue={inicial.condominio_id}
              >
                {condominios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      </Card>

      <Card
        titulo="Pagamento"
        descricao="Formas exibidas no PDF e condições fora do padrão."
      >
        <div className="flex flex-col gap-5">
          <Checkbox
            name="incluir_tss"
            label="Incluir TSS (rateio por unidade)"
            defaultChecked={inicial.incluir_tss}
          />

          <FormasPagamentoVisiveis
            inicial={inicial.formas_pagamento_visiveis}
          />

          <ParcelasCustom
            name="parcelas_custom"
            inicial={inicial.parcelas_custom}
          />
        </div>
      </Card>

      <Card
        titulo="Gerenciamento mensal"
        descricao="Valor da leitura/monitoramento após a instalação."
      >
        <div className="max-w-xs">
          <Field label="Gerenciamento mensal (R$/hidrômetro)">
            <TextInput
              type="number"
              step="0.01"
              min="0"
              name="valor_por_hidrometro"
              defaultValue={String(inicial.valor_por_hidrometro)}
            />
          </Field>
        </div>
      </Card>

      <Card titulo="Prazo e observações">
        <div className="flex flex-col gap-5">
          <Field label="Prazo">
            <TextInput name="prazo" defaultValue={inicial.prazo ?? ""} />
          </Field>
          <Field label="Observações">
            <Textarea
              name="observacoes"
              defaultValue={inicial.observacoes ?? ""}
            />
          </Field>
        </div>
      </Card>

      {state.ok ? <FormSuccess message={state.mensagem ?? "Salvo."} /> : null}
      <FormError message={state.error} />

      <div className="flex justify-end">
        <SubmitButton icone={<IconCheck />}>Salvar cabeçalho</SubmitButton>
      </div>
    </form>
  );
}
