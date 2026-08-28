import { ModeloPropostaForm } from "@/components/modelo-proposta-form";
import { TemplateTextoForm } from "@/components/template-texto-form";
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
        "sec_individualizacao_agua, sec_objetivo, sec_procedimento_tecnico, sec_intervencao, sec_tramites_administrativos, sec_gerenciamento_mensal, sec_garantia",
      )
      .eq("is_padrao", true)
      .maybeSingle(),
    supabase.from("modelos_proposta").select("tipo, secoes, intro, ativo"),
  ]);

  const porTipo = new Map(
    (modelos ?? []).map((m) => [m.tipo, m]),
  );

  return (
    <main className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Textos-modelo dos orçamentos</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Edite aqui os textos fixos que entram nos PDFs. Números, valores e
          tabelas continuam vindo dos dados de cada orçamento.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Individualização completa</h2>
        <TemplateTextoForm
          inicial={{
            sec_individualizacao_agua: tpl?.sec_individualizacao_agua ?? null,
            sec_objetivo: tpl?.sec_objetivo ?? null,
            sec_procedimento_tecnico: tpl?.sec_procedimento_tecnico ?? null,
            sec_intervencao: tpl?.sec_intervencao ?? null,
            sec_tramites_administrativos:
              tpl?.sec_tramites_administrativos ?? null,
            sec_gerenciamento_mensal: tpl?.sec_gerenciamento_mensal ?? null,
            sec_garantia: tpl?.sec_garantia ?? null,
          }}
        />
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold">
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
    </main>
  );
}
