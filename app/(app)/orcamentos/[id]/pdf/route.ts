import { createElement } from "react";

import { renderToBuffer } from "@react-pdf/renderer";

import {
  OrcamentoPdf,
  type FormaOpcao,
  type TipoPdf,
} from "@/components/pdf/orcamento-pdf";
import {
  gerarPdfGestao,
  type OrcGestaoCondominio,
} from "@/app/(app)/orcamentos/[id]/pdf/gestao";
import { gerarPdfTssLight } from "@/app/(app)/orcamentos/[id]/pdf/tss";
import { gerarPdfIndividualizacaoGas } from "@/app/(app)/orcamentos/[id]/pdf/individualizacao-gas";
import { requireUsuario } from "@/lib/auth";
import { dataPorExtenso } from "@/lib/data-extenso";
import { isGestaoMensal } from "@/lib/modelos-proposta";
import { round2 } from "@/lib/orcamento-calc";
import { assetDataUri } from "@/lib/pdf-assets";
import {
  precosCongeladosPorForma,
  precosVigentesPorForma,
} from "@/lib/orcamento-precos";
import { textoParcelamento } from "@/lib/pagamento";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRAZO_PADRAO =
  "a) O sistema será implantado em 45 (quarenta e cinco) dias úteis, de acordo com cronograma a ser desenvolvido de forma conjunta com o condomínio.";

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });


function descricaoPontos(
  itens: { item_id: string; quantidade: number }[],
  pontoIds: Set<string>,
  hidraId: string | null,
  incluirTss: boolean,
): string {
  const pontos = itens.reduce(
    (a, ci) => (pontoIds.has(ci.item_id) ? a + ci.quantidade : a),
    0,
  );
  const hidras = hidraId
    ? itens.reduce(
        (a, ci) => (ci.item_id === hidraId ? a + ci.quantidade : a),
        0,
      )
    : 0;
  const partes: string[] = [];
  partes.push(
    `${String(pontos).padStart(2, "0")} ${pontos === 1 ? "Hidrômetro" : "Hidrômetros"}${incluirTss ? " + Tss" : ""}`,
  );
  if (hidras > 0) {
    partes.push(
      `${String(hidras).padStart(2, "0")} ${hidras === 1 ? "Válvula Hidra" : "Válvulas Hidra"}`,
    );
  }
  return partes.join(" + ");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireUsuario();
  const { id } = await params;
  const supabase = await createClient();

  const { data: orc } = await supabase
    .from("orcamentos")
    .select(
      "id, numero, data_orcamento, tipo_proposta, incluir_tss, parcelas_custom, qtd_equipamentos, tss_opcoes, prazo, condominios(nome, endereco, cidade, uf, administradora), templates_texto(sec_individualizacao_agua, sec_objetivo, sec_procedimento_tecnico, sec_intervencao, sec_tramites_administrativos, sec_gerenciamento_mensal, sec_garantia)",
    )
    .eq("id", id)
    .single();
  if (!orc) return new Response("Orçamento não encontrado.", { status: 404 });

  if (isGestaoMensal(orc.tipo_proposta)) {
    return gerarPdfGestao(supabase, id, {
      numero: orc.numero,
      data_orcamento: orc.data_orcamento,
      tipo_proposta: orc.tipo_proposta,
      condominios: orc.condominios as OrcGestaoCondominio,
    });
  }
  if (orc.tipo_proposta === "tss_light") {
    return gerarPdfTssLight(supabase, {
      numero: orc.numero,
      data_orcamento: orc.data_orcamento,
      prazo: orc.prazo,
      qtd_equipamentos: orc.qtd_equipamentos,
      tss_opcoes: orc.tss_opcoes,
      condominios: orc.condominios as OrcGestaoCondominio,
    });
  }
  if (orc.tipo_proposta === "individualizacao_gas") {
    return gerarPdfIndividualizacaoGas(supabase, id, {
      numero: orc.numero,
      data_orcamento: orc.data_orcamento,
      prazo: orc.prazo,
      tss_opcoes: orc.tss_opcoes,
      condominios: orc.condominios as OrcGestaoCondominio,
    });
  }
  if (orc.tipo_proposta !== "completa") {
    return new Response(
      "O PDF deste tipo de proposta ainda não está disponível.",
      { status: 400 },
    );
  }

  const [{ data: tiposRaw }, { data: itens }, { data: gm }, { data: formas }] =
    await Promise.all([
      supabase
        .from("tipos_apartamento")
        .select(
          "nome, unidades, ordem, tipo_apartamento_itens(item_id, quantidade, ordem)",
        )
        .eq("orcamento_id", id)
        .order("ordem"),
      supabase.from("itens_precificaveis").select("id, slug, unidade, is_tss"),
      supabase
        .from("gerenciamento_mensal")
        .select("valor_por_hidrometro")
        .eq("orcamento_id", id)
        .maybeSingle(),
      supabase
        .from("formas_pagamento")
        .select("id, nome, num_parcelas, ordem, ativo, usa_preco_de_forma_id")
        .eq("ativo", true)
        .order("ordem"),
    ]);

  const tipos = (tiposRaw ?? []).map((t) => ({
    nome: t.nome,
    unidades: t.unidades,
    itens: (
      (t.tipo_apartamento_itens as {
        item_id: string;
        quantidade: number;
      }[]) ?? []
    ).map((ci) => ({ item_id: ci.item_id, quantidade: ci.quantidade })),
  }));

  if (tipos.length === 0) {
    return new Response(
      "Monte o orçamento (adicione tipos de apartamento e salve) antes de gerar o PDF.",
      { status: 400 },
    );
  }

  const catalogo = itens ?? [];
  const tssItem = catalogo.find((i) => i.is_tss) ?? null;
  const hidra = catalogo.find((i) => i.slug === "hidra") ?? null;
  const caixa = catalogo.find((i) => i.slug === "caixa_acoplada") ?? null;
  const pontoIds = new Set(
    catalogo.filter((i) => i.unidade === "ponto").map((i) => i.id),
  );

  const totalUnidades = tipos.reduce((a, t) => a + t.unidades, 0);
  const itemIds = catalogo.map((i) => i.id);

  const todasFormas = formas ?? [];
  const formasProprias = todasFormas.filter((f) => !f.usa_preco_de_forma_id);
  const [congPorForma, vigPorForma] = await Promise.all([
    precosCongeladosPorForma(supabase, id),
    precosVigentesPorForma(
      supabase,
      formasProprias.map((f) => f.id),
      itemIds,
      orc.data_orcamento,
    ),
  ]);

  // preço unitário por (forma própria -> item): congelado > vigente na data > 0
  const precoPorForma = new Map<string, Map<string, number>>();
  for (const f of formasProprias) {
    const cong = congPorForma.get(f.id) ?? new Map();
    const vig = vigPorForma.get(f.id) ?? new Map();
    const mapa = new Map<string, number>();
    for (const itemId of itemIds) {
      mapa.set(itemId, cong.get(itemId)?.valor ?? vig.get(itemId)?.valor ?? 0);
    }
    precoPorForma.set(f.id, mapa);
  }

  const forma12x = formasProprias.find((f) => f.num_parcelas === 12);
  const precos12x =
    (forma12x && precoPorForma.get(forma12x.id)) ?? new Map<string, number>();

  // formas exibidas no PDF: as 4 próprias + as extras (parcelas_custom), que usam os preços de 12x
  type FormaRender = {
    nome: string;
    numParcelas: number;
    precos: Map<string, number>;
  };
  const formasRender: FormaRender[] = [
    ...formasProprias.map((f) => ({
      nome: f.nome,
      numParcelas: f.num_parcelas,
      precos: precoPorForma.get(f.id) ?? new Map<string, number>(),
    })),
    ...(orc.parcelas_custom ?? []).map((n) => ({
      nome: `${n}x`,
      numParcelas: n,
      precos: precos12x,
    })),
  ];

  const tiposPdf: TipoPdf[] = tipos.map((t) => {
    const qtdCaixa = caixa
      ? t.itens.reduce(
          (a, ci) => (ci.item_id === caixa.id ? a + ci.quantidade : a),
          0,
        )
      : 0;
    const qtdHidra = hidra
      ? t.itens.reduce(
          (a, ci) => (ci.item_id === hidra.id ? a + ci.quantidade : a),
          0,
        )
      : 0;
    const temCaixaEHidra = qtdCaixa > 0 && qtdHidra > 0;

    const opcoes: FormaOpcao[] = formasRender.map((f) => {
      const somaItens = t.itens.reduce((acc, ci) => {
        if (tssItem && ci.item_id === tssItem.id) return acc;
        return acc + ci.quantidade * (f.precos.get(ci.item_id) ?? 0);
      }, 0);
      const tssVal =
        orc.incluir_tss && tssItem ? (f.precos.get(tssItem.id) ?? 0) : 0;
      const rateio = totalUnidades > 0 ? tssVal / totalUnidades : 0;
      const valorPorApartamento = round2(somaItens + rateio);

      const nota =
        temCaixaEHidra && caixa && hidra
          ? `Considerar os valores de ${brl(f.precos.get(caixa.id) ?? 0)} por hidrômetro e ${brl(f.precos.get(hidra.id) ?? 0)} para cada troca de válvula hidra para caixa acoplada cor branca.`
          : null;

      return {
        formaNome: f.nome,
        valorPorApartamento,
        textoPagamento: textoParcelamento(valorPorApartamento, f.numParcelas),
        nota,
      };
    });
    return {
      nome: t.nome,
      descricaoPontos: descricaoPontos(
        t.itens,
        pontoIds,
        hidra?.id ?? null,
        orc.incluir_tss,
      ),
      opcoes,
    };
  });

  const cond = orc.condominios as {
    nome: string;
    endereco: string | null;
    cidade: string | null;
    uf: string | null;
    administradora: string | null;
  } | null;
  const tpl = orc.templates_texto as Record<string, string | null> | null;

  const enderecoLinha = [
    cond?.endereco,
    cond?.cidade && cond?.uf ? `${cond.cidade}/${cond.uf}` : cond?.cidade,
  ]
    .filter(Boolean)
    .join(" - ");

  const [aHeader, aFooter, aWatermark, aFotoInterv, aFotoGer] =
    await Promise.all([
      assetDataUri("timbre-header.png"),
      assetDataUri("timbre-footer.png"),
      assetDataUri("timbre-watermark.png"),
      assetDataUri("foto-intervencao.png"),
      assetDataUri("foto-gerenciamento.png"),
    ]);

  const buffer = await renderToBuffer(
    createElement(OrcamentoPdf, {
      numero: orc.numero,
      cidade: cond?.cidade ?? "Santos",
      dataExtenso: dataPorExtenso(orc.data_orcamento),
      condominioNome: cond?.nome ?? "",
      condominioEndereco: enderecoLinha,
      administradora: cond?.administradora ?? null,
      valorPorHidrometro: gm?.valor_por_hidrometro ?? 0,
      assets: {
        header: aHeader,
        footer: aFooter,
        watermark: aWatermark,
        fotoIntervencao: aFotoInterv,
        fotoGerenciamento: aFotoGer,
      },
      textos: {
        individualizacao: tpl?.sec_individualizacao_agua ?? "",
        objetivo: tpl?.sec_objetivo ?? "",
        procedimento: tpl?.sec_procedimento_tecnico ?? "",
        intervencao: tpl?.sec_intervencao ?? "",
        tramites: tpl?.sec_tramites_administrativos ?? "",
        gerenciamento: tpl?.sec_gerenciamento_mensal ?? "",
        prazo: orc.prazo?.trim() || PRAZO_PADRAO,
        garantia: tpl?.sec_garantia ?? "",
      },
      tipos: tiposPdf,
    }) as Parameters<typeof renderToBuffer>[0],
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="orcamento-${orc.numero}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
