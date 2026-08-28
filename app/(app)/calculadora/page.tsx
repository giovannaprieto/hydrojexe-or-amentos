import { CalculadoraForm } from "@/components/calculadora-form";
import { PageHeader } from "@/components/ui-layout";
import { requireUsuario } from "@/lib/auth";
import { precosVigentesPorForma } from "@/lib/orcamento-precos";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Calculadora · Hydrojexe" };

export default async function CalculadoraPage() {
  await requireUsuario();
  const supabase = await createClient();
  const hoje = new Date().toISOString().slice(0, 10);

  const [{ data: itens }, { data: formasRaw }] = await Promise.all([
    supabase
      .from("itens_precificaveis")
      .select("id, nome, slug, unidade, is_tss, ordem")
      .order("ordem"),
    supabase
      .from("formas_pagamento")
      .select("id, nome, slug, num_parcelas, ordem")
      .eq("ativo", true)
      .is("usa_preco_de_forma_id", null)
      .order("ordem"),
  ]);

  const catalogo = itens ?? [];
  const formas = formasRaw ?? [];

  const vig = await precosVigentesPorForma(
    supabase,
    formas.map((f) => f.id),
    catalogo.map((i) => i.id),
    hoje,
  );

  // precoUnitPorForma: { formaId: { itemId: valor } }
  const precoUnitPorForma: Record<string, Record<string, number>> = {};
  for (const f of formas) {
    const mapa: Record<string, number> = {};
    const vf = vig.get(f.id);
    for (const it of catalogo) mapa[it.id] = vf?.get(it.id)?.valor ?? 0;
    precoUnitPorForma[f.id] = mapa;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Calculadora de orçamento"
        descricao="Simulação rápida de valores, usando as mesmas regras dos orçamentos oficiais. Nada é cadastrado."
      />
      <CalculadoraForm
        catalogo={catalogo}
        formas={formas.map((f) => ({
          id: f.id,
          nome: f.nome,
          slug: f.slug,
          num_parcelas: f.num_parcelas,
        }))}
        precoUnitPorForma={precoUnitPorForma}
      />
    </div>
  );
}
