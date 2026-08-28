import Link from "next/link";
import { notFound } from "next/navigation";

import {
  atualizarPrecosPelaTabela,
  excluirOrcamento,
} from "@/app/(app)/orcamentos/actions";
import { GestaoMensalForm } from "@/components/gestao-mensal-form";
import { IndividualizacaoGasForm } from "@/components/individualizacao-gas-form";
import { TssLightForm } from "@/components/tss-light-form";
import { OrcamentoBuilder } from "@/components/orcamento-builder";
import { OrcamentoCabecalhoForm } from "@/components/orcamento-cabecalho-form";
import { OrcamentoHistorico } from "@/components/orcamento-historico";
import { requireUsuario } from "@/lib/auth";
import { MODELOS_GESTAO, isGestaoMensal } from "@/lib/modelos-proposta";
import { formatBRL, formatDateBR } from "@/lib/format";
import {
  precosCongeladosPorForma,
  precosVigentesPorForma,
} from "@/lib/orcamento-precos";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Orçamento · Hydrojexe" };

export default async function OrcamentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string; recongelar?: string }>;
}) {
  await requireUsuario();
  const { id } = await params;
  const { erro, recongelar } = await searchParams;
  const supabase = await createClient();

  const { data: orc } = await supabase
    .from("orcamentos")
    .select(
      "id, numero, data_orcamento, condominio_id, status, tipo_proposta, incluir_tss, parcelas_custom, qtd_equipamentos, tss_opcoes, prazo, observacoes, total_unidades, valor_tss, valor_total, condominios(nome)",
    )
    .eq("id", id)
    .single();
  if (!orc) notFound();

  const [
    { data: condominios },
    { data: formasRaw },
    { data: itens },
    { data: tiposRaw },
    { data: gm },
    { data: historico },
  ] = await Promise.all([
    supabase.from("condominios").select("id, nome").order("nome"),
    supabase
      .from("formas_pagamento")
      .select("id, nome, slug, ordem, ativo, usa_preco_de_forma_id")
      .eq("ativo", true)
      .is("usa_preco_de_forma_id", null)
      .order("ordem"),
    supabase
      .from("itens_precificaveis")
      .select("id, nome, unidade, is_tss, ativo, ordem")
      .eq("ativo", true)
      .order("ordem")
      .order("nome"),
    supabase
      .from("tipos_apartamento")
      .select(
        "id, nome, unidades, ordem, tipo_apartamento_itens(item_id, quantidade, ordem)",
      )
      .eq("orcamento_id", id)
      .order("ordem"),
    supabase
      .from("gerenciamento_mensal")
      .select(
        "valor_por_hidrometro, qtd_hidrometros, qtd_apartamentos, pontos_por_apartamento",
      )
      .eq("orcamento_id", id)
      .maybeSingle(),
    supabase
      .from("historico_alteracoes")
      .select(
        "id, acao, campo, valor_antes, valor_depois, descricao, alterado_em, usuarios(nome)",
      )
      .eq("orcamento_id", id)
      .order("alterado_em", { ascending: false }),
  ]);

  const catalogo = itens ?? [];
  const formasProprias = formasRaw ?? [];
  const tssItem = catalogo.find((i) => i.is_tss) ?? null;
  const pontoIds = new Set(
    catalogo.filter((i) => i.unidade === "ponto").map((i) => i.id),
  );
  const idsCatalogo = catalogo.map((i) => i.id);
  const formaBase =
    formasProprias.find((f) => f.slug === "a_vista") ?? formasProprias[0];

  // preços por forma: congelado > vigente na data > 0
  const [congPorForma, vigPorForma] = await Promise.all([
    precosCongeladosPorForma(supabase, id),
    precosVigentesPorForma(
      supabase,
      formasProprias.map((f) => f.id),
      idsCatalogo,
      orc.data_orcamento,
    ),
  ]);
  const precoUnitPorForma: Record<string, Record<string, number>> = {};
  const precoOrigem: Record<string, "congelado" | "atual" | "sem"> = {};

  for (const f of formasProprias) {
    const cong = congPorForma.get(f.id) ?? new Map();
    const vig = vigPorForma.get(f.id) ?? new Map();
    const mapa: Record<string, number> = {};
    for (const it of catalogo) {
      if (cong.has(it.id)) {
        mapa[it.id] = cong.get(it.id)!.valor;
        if (f.id === formaBase?.id) precoOrigem[it.id] = "congelado";
      } else if (vig.has(it.id)) {
        mapa[it.id] = vig.get(it.id)!.valor;
        if (f.id === formaBase?.id) precoOrigem[it.id] = "atual";
      } else {
        mapa[it.id] = 0;
        if (f.id === formaBase?.id) precoOrigem[it.id] = "sem";
      }
    }
    precoUnitPorForma[f.id] = mapa;
  }

  // formas extras (nº de parcelas custom) — preview usa os preços de 12x
  const forma12x = formasProprias.find((f) => f.slug === "12x");
  const formasBuilder = [
    ...formasProprias.map((f) => ({ id: f.id, nome: f.nome })),
    ...(orc.parcelas_custom ?? []).map((n) => ({
      id: `custom-${n}`,
      nome: `${n}x`,
    })),
  ];
  const precoUnitPorFormaBuilder: Record<string, Record<string, number>> = {
    ...precoUnitPorForma,
  };
  for (const n of orc.parcelas_custom ?? []) {
    precoUnitPorFormaBuilder[`custom-${n}`] = forma12x
      ? (precoUnitPorForma[forma12x.id] ?? {})
      : {};
  }

  const tiposIniciais = (tiposRaw ?? []).map((t) => ({
    nome: t.nome,
    unidades: t.unidades,
    itens: [
      ...((t.tipo_apartamento_itens as {
        item_id: string;
        quantidade: number;
        ordem: number;
      }[]) ?? []),
    ]
      .sort((a, b) => a.ordem - b.ordem)
      .map((ci) => ({ item_id: ci.item_id, quantidade: ci.quantidade })),
  }));

  const autoHidro = tiposIniciais.reduce((acc, t) => {
    const pontos = t.itens.reduce(
      (a, ci) => (pontoIds.has(ci.item_id) ? a + ci.quantidade : a),
      0,
    );
    return acc + t.unidades * pontos;
  }, 0);
  const gmQtd = gm?.qtd_hidrometros ?? null;
  const overrideInicial = gmQtd != null && gmQtd !== autoHidro ? gmQtd : null;

  const condominioNome = (orc.condominios as { nome: string } | null)?.nome;

  const opcoesTss: { valor: number; parcelas: number }[] = Array.isArray(
    orc.tss_opcoes,
  )
    ? (orc.tss_opcoes as unknown[])
        .map((x) => {
          const o = x as { valor?: unknown; parcelas?: unknown };
          return {
            valor: Number(o.valor) || 0,
            parcelas: Math.trunc(Number(o.parcelas) || 0),
          };
        })
        .filter((o) => o.valor > 0)
    : [];

  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <Link
          href="/orcamentos"
          className="text-sm text-black/60 dark:text-white/60"
        >
          ← Orçamentos
        </Link>
        <h1 className="text-xl font-semibold">
          {orc.numero} · {condominioNome}
        </h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          {formatDateBR(orc.data_orcamento)} · status {orc.status}
        </p>
      </div>

      {erro ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
          {erro}
        </p>
      ) : null}
      {recongelar ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
          Congelamento limpo. Clique em “Salvar orçamento” para recongelar os
          preços pela tabela vigente.
        </p>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Dados gerais</h2>
        <OrcamentoCabecalhoForm
          inicial={{
            id: orc.id,
            numero: orc.numero,
            data_orcamento: orc.data_orcamento,
            condominio_id: orc.condominio_id,
            status: orc.status,
            tipo_proposta: orc.tipo_proposta,
            incluir_tss: orc.incluir_tss,
            parcelas_custom: orc.parcelas_custom ?? [],
            prazo: orc.prazo,
            observacoes: orc.observacoes,
            valor_por_hidrometro: gm?.valor_por_hidrometro ?? 0,
          }}
          condominios={condominios ?? []}
        />
      </section>

      {orc.tipo_proposta === "completa" ? (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Composição e cálculo</h2>
            <OrcamentoBuilder
              orcamentoId={orc.id}
              incluirTss={orc.incluir_tss}
              itens={catalogo.map((i) => ({
                id: i.id,
                nome: i.nome,
                unidade: i.unidade,
                is_tss: i.is_tss,
              }))}
              formas={formasBuilder}
              formaBaseId={formaBase?.id ?? ""}
              precoUnitPorForma={precoUnitPorFormaBuilder}
              precoOrigem={precoOrigem}
              tssItemId={tssItem?.id ?? null}
              tiposIniciais={tiposIniciais}
              valorPorHidrometro={gm?.valor_por_hidrometro ?? 0}
              qtdHidrometrosOverrideInicial={overrideInicial}
            />
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Última gravação</h2>
            <div className="rounded-lg border border-black/10 p-4 text-sm dark:border-white/10">
              <p>
                Total de unidades: {orc.total_unidades ?? "—"} · TSS congelado (à
                vista): {formatBRL(orc.valor_tss)} · Total à vista:{" "}
                <strong>{formatBRL(orc.valor_total)}</strong>
              </p>
              <p className="text-black/60 dark:text-white/60">
                Gerenciamento: {formatBRL(gm?.valor_por_hidrometro ?? 0)}/hidrômetro
                · {gm?.qtd_hidrometros ?? "—"} hidrômetro(s)
              </p>
            </div>
          </section>
        </>
      ) : isGestaoMensal(orc.tipo_proposta) ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Gestão mensal</h2>
          <GestaoMensalForm
            inicial={{
              id: orc.id,
              sistema: MODELOS_GESTAO[orc.tipo_proposta].sistema,
              ponto: MODELOS_GESTAO[orc.tipo_proposta].ponto,
              qtd_apartamentos: gm?.qtd_apartamentos ?? 0,
              pontos_por_apartamento: gm?.pontos_por_apartamento ?? 1,
              valor_por_apartamento: gm?.valor_por_hidrometro ?? 0,
            }}
          />
        </section>
      ) : orc.tipo_proposta === "tss_light" ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">TSS Light</h2>
          <TssLightForm
            inicial={{
              id: orc.id,
              qtd_equipamentos: orc.qtd_equipamentos ?? 1,
              opcoes: opcoesTss,
            }}
          />
        </section>
      ) : orc.tipo_proposta === "individualizacao_gas" ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Individualização de gás</h2>
          <IndividualizacaoGasForm
            inicial={{
              id: orc.id,
              qtd_apartamentos: gm?.qtd_apartamentos ?? 0,
              pontos_por_apartamento: gm?.pontos_por_apartamento ?? 1,
              valor_gerenciamento: gm?.valor_por_hidrometro ?? 0,
              opcoes: opcoesTss,
            }}
          />
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Composição e cálculo</h2>
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
            O editor deste tipo de proposta ainda não está disponível — em breve
            (etapa seguinte). Por enquanto, só o cabeçalho e o histórico
            funcionam para esta proposta.
          </p>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Histórico de alterações</h2>
        <OrcamentoHistorico
          linhas={(historico ?? []).map((h) => ({
            id: h.id,
            acao: h.acao,
            campo: h.campo,
            valor_antes: h.valor_antes,
            valor_depois: h.valor_depois,
            descricao: h.descricao,
            alterado_em: h.alterado_em,
            usuario: (h.usuarios as { nome: string } | null)?.nome ?? null,
          }))}
        />
      </section>

      <section className="flex flex-wrap gap-3 border-t border-black/10 pt-4 dark:border-white/10">
        {orc.tipo_proposta === "completa" ||
        isGestaoMensal(orc.tipo_proposta) ||
        orc.tipo_proposta === "tss_light" ||
        orc.tipo_proposta === "individualizacao_gas" ? (
          <a
            href={`/orcamentos/${orc.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background"
          >
            Gerar PDF
          </a>
        ) : null}
        {orc.tipo_proposta === "completa" ? (
          <form action={atualizarPrecosPelaTabela}>
            <input type="hidden" name="id" value={orc.id} />
            <button
              type="submit"
              className="rounded-md border border-black/15 px-3 py-2 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Recongelar preços pela tabela atual
            </button>
          </form>
        ) : null}
        <form action={excluirOrcamento}>
          <input type="hidden" name="id" value={orc.id} />
          <button
            type="submit"
            className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            Excluir orçamento
          </button>
        </form>
      </section>
    </main>
  );
}
