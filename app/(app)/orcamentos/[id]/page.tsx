import { notFound } from "next/navigation";

import {
  atualizarPrecosPelaTabela,
  excluirOrcamento,
} from "@/app/(app)/orcamentos/actions";
import { GestaoMensalForm } from "@/components/gestao-mensal-form";
import { IconPdf, IconRefresh, IconTrash } from "@/components/icons";
import { IndividualizacaoGasForm } from "@/components/individualizacao-gas-form";
import { TssLightForm } from "@/components/tss-light-form";
import { OrcamentoBuilder } from "@/components/orcamento-builder";
import { OrcamentoCabecalhoForm } from "@/components/orcamento-cabecalho-form";
import { OrcamentoHistorico } from "@/components/orcamento-historico";
import {
  Alert,
  Card,
  DataList,
  LinkButton,
  PageHeader,
  StatusBadge,
} from "@/components/ui-layout";
import { requireUsuario } from "@/lib/auth";
import { MODELOS_GESTAO, isGestaoMensal } from "@/lib/modelos-proposta";
import { rotuloTipoProposta } from "@/lib/orcamento-tipos";
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
      "id, numero, data_orcamento, condominio_id, status, tipo_proposta, incluir_tss, parcelas_custom, qtd_equipamentos, tss_opcoes, medidor_gas, prazo, observacoes, total_unidades, valor_tss, valor_total, condominios(nome)",
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
      .select("id, nome, slug, num_parcelas, ordem, ativo, usa_preco_de_forma_id")
      .eq("ativo", true)
      .is("usa_preco_de_forma_id", null)
      .order("ordem"),
    supabase
      .from("itens_precificaveis")
      .select("id, nome, slug, unidade, is_tss, ativo, ordem")
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

  // preços vigentes dos medidores de gás, por forma — p/ o preview automático
  // do formulário de individualização de gás
  const precoPorMedidorGas: Record<
    string,
    { nome: string; num_parcelas: number; valorUnit: number }[]
  > =
    orc.tipo_proposta === "individualizacao_gas"
      ? Object.fromEntries(
          ["gas_1_6", "gas_2_5"].map((slug) => {
            const it = catalogo.find((i) => i.slug === slug);
            return [
              slug,
              it
                ? formasProprias.map((f) => ({
                    nome: f.nome,
                    num_parcelas: f.num_parcelas,
                    valorUnit: vigPorForma.get(f.id)?.get(it.id)?.valor ?? 0,
                  }))
                : [],
            ];
          }),
        )
      : {};

  const podeGerarPdf =
    orc.tipo_proposta === "completa" ||
    isGestaoMensal(orc.tipo_proposta) ||
    orc.tipo_proposta === "tss_light" ||
    orc.tipo_proposta === "individualizacao_gas";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo={`${orc.numero} · ${condominioNome}`}
        voltar={{ href: "/orcamentos", rotulo: "Orçamentos" }}
        etiqueta={<StatusBadge status={orc.status} />}
        descricao={`${rotuloTipoProposta(orc.tipo_proposta)} · ${formatDateBR(orc.data_orcamento)}`}
        acoes={
          podeGerarPdf ? (
            <LinkButton
              href={`/orcamentos/${orc.id}/pdf`}
              variante="primary"
              externo
            >
              <IconPdf />
              Gerar PDF
            </LinkButton>
          ) : null
        }
      />

      {erro ? <Alert tom="error">{erro}</Alert> : null}
      {recongelar ? (
        <Alert tom="warn">
          Congelamento limpo. Clique em “Salvar orçamento” para recongelar os
          preços pela tabela vigente.
        </Alert>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="hj-section-title">Dados gerais</h2>
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
            <h2 className="hj-section-title">Composição e cálculo</h2>
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

          <section className="flex flex-col gap-3">
            <h2 className="hj-section-title">Última gravação</h2>
            <Card>
              <DataList
                colunas={4}
                itens={[
                  {
                    rotulo: "Total de unidades",
                    valor: orc.total_unidades ?? "—",
                  },
                  {
                    rotulo: "TSS congelado (à vista)",
                    valor: formatBRL(orc.valor_tss),
                  },
                  {
                    rotulo: "Total à vista",
                    valor: (
                      <span className="text-brand-700">
                        {formatBRL(orc.valor_total)}
                      </span>
                    ),
                  },
                  {
                    rotulo: "Gerenciamento",
                    valor: `${formatBRL(gm?.valor_por_hidrometro ?? 0)}/hidrômetro · ${gm?.qtd_hidrometros ?? "—"} hidrômetro(s)`,
                  },
                ]}
              />
            </Card>
          </section>
        </>
      ) : isGestaoMensal(orc.tipo_proposta) ? (
        <section className="flex flex-col gap-3">
          <h2 className="hj-section-title">Gestão mensal</h2>
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
          <h2 className="hj-section-title">TSS Light</h2>
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
          <h2 className="hj-section-title">Individualização de gás</h2>
          <IndividualizacaoGasForm
            inicial={{
              id: orc.id,
              qtd_apartamentos: gm?.qtd_apartamentos ?? 0,
              pontos_por_apartamento: gm?.pontos_por_apartamento ?? 1,
              valor_gerenciamento: gm?.valor_por_hidrometro ?? 0,
              medidor_gas: orc.medidor_gas,
            }}
            precoPorMedidor={precoPorMedidorGas}
          />
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="hj-section-title">Composição e cálculo</h2>
          <Alert tom="warn">
            O editor deste tipo de proposta ainda não está disponível — em breve
            (etapa seguinte). Por enquanto, só o cabeçalho e o histórico
            funcionam para esta proposta.
          </Alert>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="hj-section-title">Histórico de alterações</h2>
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

      <section className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 pt-6">
        <div className="flex flex-wrap gap-2">
          {podeGerarPdf ? (
            <LinkButton
              href={`/orcamentos/${orc.id}/pdf`}
              variante="primary"
              externo
            >
              <IconPdf />
              Gerar PDF
            </LinkButton>
          ) : null}
          {orc.tipo_proposta === "completa" ? (
            <form action={atualizarPrecosPelaTabela}>
              <input type="hidden" name="id" value={orc.id} />
              <button type="submit" className="hj-btn hj-btn-secondary">
                <IconRefresh />
                Recongelar preços pela tabela atual
              </button>
            </form>
          ) : null}
        </div>
        <form action={excluirOrcamento}>
          <input type="hidden" name="id" value={orc.id} />
          <button type="submit" className="hj-btn hj-btn-danger">
            <IconTrash />
            Excluir orçamento
          </button>
        </form>
      </section>
    </div>
  );
}
