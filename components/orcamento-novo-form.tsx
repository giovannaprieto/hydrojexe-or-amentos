"use client";

import { useActionState } from "react";

import { criarOrcamento } from "@/app/(app)/orcamentos/actions";
import { FormasPagamentoVisiveis } from "@/components/formas-pagamento-visiveis";
import { IconPlus } from "@/components/icons";
import { ParcelasCustom } from "@/components/parcelas-custom";
import {
  Checkbox,
  Field,
  FormError,
  Select,
  SubmitButton,
  TextInput,
  Textarea,
} from "@/components/ui";
import { Card } from "@/components/ui-layout";
import { emptyFormState } from "@/lib/forms";
import { TIPOS_PROPOSTA } from "@/lib/orcamento-tipos";

type Opcao = { id: string; nome: string };

export function OrcamentoNovoForm({
  condominios,
  numeroSugerido,
  hoje,
}: {
  condominios: Opcao[];
  numeroSugerido: string;
  hoje: string;
}) {
  const [state, formAction] = useActionState(criarOrcamento, emptyFormState);

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-5">
      <Card
        titulo="Proposta"
        descricao="Define o modelo de PDF e quais campos você vai preencher."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Tipo de proposta *">
              <Select name="tipo_proposta" defaultValue="completa">
                {TIPOS_PROPOSTA.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.rotulo}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Condomínio *">
              <Select name="condominio_id" required defaultValue="">
                <option value="" disabled>
                  Selecione…
                </option>
                {condominios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field
              label="Cenário da análise técnica (água)"
              hint="Só se aplica à Individualização de água. Pode ajustar depois."
            >
              <Select name="cenario_agua" defaultValue="auto">
                <option value="auto">
                  Automático (pelo cadastro do condomínio)
                </option>
                <option value="caixa_acoplada">Caixa acoplada, sem hidra</option>
              </Select>
            </Field>
          </div>

          <Field label="Número *" hint="Sugerido automaticamente; pode alterar.">
            <TextInput name="numero" required defaultValue={numeroSugerido} />
          </Field>
          <Field label="Data do orçamento *">
            <TextInput
              type="date"
              name="data_orcamento"
              required
              defaultValue={hoje}
            />
          </Field>
        </div>
      </Card>

      <Card
        titulo="Condições comerciais"
        descricao="Podem ser ajustadas depois, na tela do orçamento."
      >
        <div className="flex flex-col gap-5">
          <div className="max-w-xs">
            <Field
              label="Gerenciamento mensal (R$/hidrômetro)"
              hint="Varia por contrato."
            >
              <TextInput
                type="number"
                step="0.01"
                min="0"
                name="valor_por_hidrometro"
                defaultValue="0"
              />
            </Field>
          </div>

          <Checkbox
            name="incluir_tss"
            label="Incluir TSS (rateio por unidade)"
            defaultChecked
          />

          <FormasPagamentoVisiveis inicial={[1, 6, 9, 12]} />

          <ParcelasCustom name="parcelas_custom" inicial={[]} />

          <Field label="Prazo">
            <TextInput name="prazo" placeholder="Ex.: 45 dias após aprovação" />
          </Field>

          <Field label="Observações">
            <Textarea name="observacoes" />
          </Field>
        </div>
      </Card>

      <FormError message={state.error} />

      <div className="flex justify-end">
        <SubmitButton pendingLabel="Criando…" icone={<IconPlus />}>
          Criar e montar
        </SubmitButton>
      </div>
    </form>
  );
}
