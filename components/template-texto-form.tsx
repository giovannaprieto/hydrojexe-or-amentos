"use client";

import { useActionState } from "react";

import { salvarTemplateTexto } from "@/app/(app)/admin/textos/actions";
import { FormError, SubmitButton, Textarea } from "@/components/ui";
import { emptyFormState } from "@/lib/forms";

export type TemplateTextoInicial = {
  sec_individualizacao_agua: string | null;
  sec_objetivo: string | null;
  sec_procedimento_tecnico: string | null;
  sec_intervencao: string | null;
  sec_tramites_administrativos: string | null;
  sec_gerenciamento_mensal: string | null;
  sec_garantia: string | null;
};

const CAMPOS: { nome: keyof TemplateTextoInicial; rotulo: string }[] = [
  { nome: "sec_individualizacao_agua", rotulo: "1. Individualização de água" },
  { nome: "sec_objetivo", rotulo: "2. Objetivo da proposta" },
  { nome: "sec_procedimento_tecnico", rotulo: "3. Procedimento técnico" },
  { nome: "sec_intervencao", rotulo: "4. Intervenção" },
  {
    nome: "sec_tramites_administrativos",
    rotulo: "5. Trâmites administrativos finais",
  },
  { nome: "sec_gerenciamento_mensal", rotulo: "6. Gerenciamento mensal" },
  { nome: "sec_garantia", rotulo: "9. Garantia" },
];

export function TemplateTextoForm({
  inicial,
}: {
  inicial: TemplateTextoInicial;
}) {
  const [state, formAction] = useActionState(
    salvarTemplateTexto,
    emptyFormState,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 dark:border-white/10"
    >
      <p className="text-sm text-black/60 dark:text-white/60">
        Textos fixos do orçamento <strong>Individualização completa</strong>. As
        seções 7 (Prazo) e 8 (Investimento) são geradas a partir dos dados de
        cada orçamento.
      </p>

      {CAMPOS.map((c) => (
        <label key={c.nome} className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{c.rotulo}</span>
          <Textarea
            name={c.nome}
            defaultValue={inicial[c.nome] ?? ""}
            rows={5}
          />
        </label>
      ))}

      {state.ok ? (
        <p className="text-sm text-green-700 dark:text-green-400">
          {state.mensagem ?? "Salvo."}
        </p>
      ) : null}
      <FormError message={state.error} />
      <SubmitButton>Salvar textos do completo</SubmitButton>
    </form>
  );
}
