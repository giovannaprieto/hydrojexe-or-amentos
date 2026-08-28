import { ModeloPropostaForm } from "@/components/modelo-proposta-form";
import { TemplateTextoForm } from "@/components/template-texto-form";
import { PageHeader } from "@/components/ui-layout";
import { requireAdmin } from "@/lib/auth";
import {
  INDIVIDUALIZACAO_GAS,
  MODELOS_PROPOSTA_TIPOS,
  sanitizeSecoes,
  secoesDefault,
} from "@/lib/modelos-proposta";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Textos-modelo · Hydrojexe" };

export default async function TextosPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: tpl }, { data: modelos }] = await Promise.all([
    supabase
      .from("templates_texto")
      .select(
        "sec_individualizacao_agua, sec_analise_agua_preparado, sec_analise_agua_nao_preparado, sec_objetivo, sec_procedimento_tecnico, sec_intervencao, sec_intervencao_agua_nao_preparado, sec_tramites_administrativos, sec_gerenciamento_mensal, sec_garantia",
      )
      .eq("is_padrao", true)
      .maybeSingle(),
    supabase.from("modelos_proposta").select("tipo, secoes, intro, ativo"),
  ]);

  const porTipo = new Map(
    (modelos ?? []).map((m) => [m.tipo, m]),
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Textos-modelo dos orçamentos"
        descricao="Edite aqui os textos fixos que entram nos PDFs. Números, valores e tabelas continuam vindo dos dados de cada orçamento."
      />

      <section className="flex flex-col gap-3">
        <h2 className="hj-section-title">Individualização de água</h2>
        <TemplateTextoForm
          inicial={{
            sec_individualizacao_agua: tpl?.sec_individualizacao_agua ?? null,
            sec_analise_agua_preparado: tpl?.sec_analise_agua_preparado ?? null,
            sec_analise_agua_nao_preparado:
              tpl?.sec_analise_agua_nao_preparado ?? null,
            sec_objetivo: tpl?.sec_objetivo ?? null,
            sec_procedimento_tecnico: tpl?.sec_procedimento_tecnico ?? null,
            sec_intervencao: tpl?.sec_intervencao ?? null,
            sec_intervencao_agua_nao_preparado:
              tpl?.sec_intervencao_agua_nao_preparado ?? null,
            sec_tramites_administrativos:
              tpl?.sec_tramites_administrativos ?? null,
            sec_gerenciamento_mensal: tpl?.sec_gerenciamento_mensal ?? null,
            sec_garantia: tpl?.sec_garantia ?? null,
          }}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="hj-section-title">
          Propostas por situação (gestão mensal, TSS Light, gás)
        </h2>
        {MODELOS_PROPOSTA_TIPOS.map((t) => {
          const row = porTipo.get(t.tipo);
          const override = sanitizeSecoes(row?.secoes);
          const usandoOverride = Boolean(row?.ativo) && override.length > 0;
          const ehGas = t.tipo === "individualizacao_gas";
          return (
            <ModeloPropostaForm
              key={t.tipo}
              tipo={t.tipo}
              nome={t.nome}
              usandoOverride={usandoOverride}
              secoesIniciais={
                usandoOverride ? override : secoesDefault(t.tipo)
              }
              introLabel={
                ehGas ? "Texto de abertura (análise técnica)" : undefined
              }
              introInicial={
                ehGas
                  ? (row?.intro ??
                    INDIVIDUALIZACAO_GAS.analiseTecnicaPadrao)
                  : undefined
              }
            />
          );
        })}
      </section>
    </div>
  );
}
