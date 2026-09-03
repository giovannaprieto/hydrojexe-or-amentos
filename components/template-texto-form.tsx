"use client";

import { useActionState } from "react";

import { salvarTemplateTexto } from "@/app/(app)/admin/textos/actions";
import { IconCheck } from "@/components/icons";
import {
  FormError,
  FormSuccess,
  SubmitButton,
  Textarea,
} from "@/components/ui";
import { Card } from "@/components/ui-layout";
import { emptyFormState } from "@/lib/forms";

export type TemplateTextoInicial = {
  sec_individualizacao_agua: string | null;
  sec_analise_agua_preparado: string | null;
  sec_analise_agua_nao_preparado: string | null;
  sec_analise_agua_caixa_acoplada: string | null;
  sec_objetivo: string | null;
  sec_procedimento_tecnico: string | null;
  sec_intervencao: string | null;
  sec_intervencao_agua_nao_preparado: string | null;
  sec_tramites_administrativos: string | null;
  sec_gerenciamento_mensal: string | null;
  sec_garantia: string | null;
};

const CAMPOS: {
  nome: keyof TemplateTextoInicial;
  rotulo: string;
  hint?: string;
}[] = [
  {
    nome: "sec_individualizacao_agua",
    rotulo: "1. Individualização de água",
    hint: "Use o marcador {analise_tecnica} onde a análise técnica deve entrar.",
  },
  {
    nome: "sec_analise_agua_preparado",
    rotulo: "1a. Análise técnica — prédio preparado",
    hint: "Substitui {analise_tecnica} quando o condomínio está marcado como preparado.",
  },
  {
    nome: "sec_analise_agua_nao_preparado",
    rotulo: "1b. Análise técnica — prédio não preparado",
    hint: "Substitui {analise_tecnica} quando o condomínio não está preparado (válvula hidra).",
  },
  {
    nome: "sec_analise_agua_caixa_acoplada",
    rotulo: "1c. Análise técnica — caixa acoplada (sem hidra)",
    hint: 'Usada quando o orçamento tem o cenário "Caixa acoplada, sem hidra" (modelo Ed. Queluz). O restante do escopo é igual ao do prédio preparado — Seção 4 usa a "Intervenção — prédio preparado", sem retrofit nem fotos.',
  },
  { nome: "sec_objetivo", rotulo: "2. Objetivo da proposta" },
  { nome: "sec_procedimento_tecnico", rotulo: "3. Procedimento técnico" },
  {
    nome: "sec_intervencao",
    rotulo: "4. Intervenção — prédio preparado",
    hint: "Usada quando o condomínio está marcado como preparado. Aceita {hidrometros}.",
  },
  {
    nome: "sec_intervencao_agua_nao_preparado",
    rotulo: "4b. Intervenção — prédio não preparado (retrofit)",
    hint: "Marcadores de foto no meio do texto: {foto_antes_depois}, {foto_revestimento}, {foto_hidrometro}, {foto_caixa_inspecao}.",
  },
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
    <form action={formAction} className="flex flex-col gap-5">
      <Card descricao="As seções 7 (Prazo) e 8 (Investimento) são geradas a partir dos dados de cada orçamento.">
        <div className="flex flex-col gap-5">
          {CAMPOS.map((c) => (
            <label key={c.nome} className="flex flex-col gap-1.5">
              <span className="hj-field-label">{c.rotulo}</span>
              <Textarea
                name={c.nome}
                defaultValue={inicial[c.nome] ?? ""}
                rows={c.nome.startsWith("sec_analise_agua") ? 3 : 5}
              />
              {c.hint ? <span className="hj-hint">{c.hint}</span> : null}
            </label>
          ))}
        </div>
      </Card>

      {state.ok ? <FormSuccess message={state.mensagem ?? "Salvo."} /> : null}
      <FormError message={state.error} />

      <div className="flex justify-end">
        <SubmitButton icone={<IconCheck />}>
          Salvar textos do completo
        </SubmitButton>
      </div>
    </form>
  );
}
