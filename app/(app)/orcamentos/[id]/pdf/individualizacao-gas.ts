import { createElement } from "react";

import { renderToBuffer } from "@react-pdf/renderer";

import { IndividualizacaoGasPdf } from "@/components/pdf/individualizacao-gas-pdf";
import { dataPorExtenso } from "@/lib/data-extenso";
import {
  filtrarPorFormasVisiveis,
  modoParcelamento,
  parcelasOrigemPreco,
  parseFormasVisiveis,
} from "@/lib/formas-pagamento";
import {
  INDIVIDUALIZACAO_GAS,
  secoesEfetivas,
  type TssOpcao,
} from "@/lib/modelos-proposta";
import { vazaoGas } from "@/lib/orcamento-especificacoes";
import { assetDataUri } from "@/lib/pdf-assets";
import type { OrcGestaoCondominio } from "@/app/(app)/orcamentos/[id]/pdf/gestao";
import type { createClient } from "@/lib/supabase/server";

type DbClient = Awaited<ReturnType<typeof createClient>>;

type OpcaoGas = TssOpcao & { medidorUnit: number; tssUnit: number };

function parseOpcoes(raw: unknown): OpcaoGas[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => {
      const o = x as {
        valor?: unknown;
        parcelas?: unknown;
        medidor_unit?: unknown;
        tss_unit?: unknown;
      };
      return {
        valor: Number(o.valor) || 0,
        parcelas: Math.trunc(Number(o.parcelas) || 0),
        medidorUnit: Number(o.medidor_unit) || 0,
        tssUnit: Number(o.tss_unit) || 0,
      };
    })
    .filter((o) => o.valor > 0)
    .slice(0, 4);
}

/** "04 (quatro)" — número com dois dígitos + extenso (feminino, p/ "unidades"). */
const EXT_TSS: Record<number, string> = {
  1: "uma",
  2: "duas",
  3: "três",
  4: "quatro",
  5: "cinco",
  6: "seis",
  7: "sete",
  8: "oito",
  9: "nove",
  10: "dez",
};
function qtdTssExtenso(n: number): string {
  return `${String(n).padStart(2, "0")}${EXT_TSS[n] ? ` (${EXT_TSS[n]})` : ""}`;
}

function parseParcelasCustom(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw
        .map((n) => Math.trunc(Number(n)))
        .filter((n) => Number.isFinite(n) && n >= 2),
    ),
  ].sort((a, b) => a - b);
}

type OrcIndivGas = {
  numero: string;
  data_orcamento: string;
  prazo: string | null;
  tss_opcoes: unknown;
  medidor_gas: string | null;
  incluir_tss: boolean;
  qtd_tss: number;
  formas_pagamento_visiveis: unknown;
  parcelas_custom: unknown;
  condominios: OrcGestaoCondominio;
};

export async function gerarPdfIndividualizacaoGas(
  supabase: DbClient,
  id: string,
  orc: OrcIndivGas,
): Promise<Response> {
  const congeladas = parseOpcoes(orc.tss_opcoes);
  if (congeladas.length === 0) {
    return new Response(
      "Preencha as opções de investimento antes de gerar o PDF.",
      { status: 400 },
    );
  }

  // parcelamento especial do condomínio (padrão: 9x<-6x, 12x<-9x;
  // longo: 12x<-6x, 24x<-9x, 36x<-12x)
  const porParcelas = new Map(congeladas.map((o) => [o.parcelas, o]));
  const modoParc = modoParcelamento(orc.condominios);
  const desloca = (o: OpcaoGas): OpcaoGas => {
    if (modoParc === "nenhum") return o;
    const origem = porParcelas.get(parcelasOrigemPreco(o.parcelas, modoParc));
    return origem
      ? {
          parcelas: o.parcelas,
          valor: origem.valor,
          medidorUnit: origem.medidorUnit,
          tssUnit: origem.tssUnit,
        }
      : o;
  };
  const efetivas = congeladas.map(desloca);

  const base12 = porParcelas.get(12) ?? congeladas[congeladas.length - 1];
  const opcoes: OpcaoGas[] = [
    ...filtrarPorFormasVisiveis(
      efetivas,
      parseFormasVisiveis(orc.formas_pagamento_visiveis),
    ),
    // extras (24x, 36x…): no modo "longo" também deslocam o valor de referência
    ...parseParcelasCustom(orc.parcelas_custom).map((n) => {
      const origem =
        porParcelas.get(parcelasOrigemPreco(n, modoParc)) ?? base12;
      return {
        parcelas: n,
        valor: origem?.valor ?? 0,
        medidorUnit: origem?.medidorUnit ?? 0,
        tssUnit: origem?.tssUnit ?? 0,
      };
    }),
  ];
  if (opcoes.length === 0) {
    return new Response(
      "Selecione ao menos uma forma de pagamento no cabeçalho do orçamento.",
      { status: 400 },
    );
  }

  const [{ data: gm }, { data: override }] = await Promise.all([
    supabase
      .from("gerenciamento_mensal")
      .select(
        "valor_por_hidrometro, qtd_apartamentos, pontos_por_apartamento, qtd_hidrometros",
      )
      .eq("orcamento_id", id)
      .maybeSingle(),
    supabase
      .from("modelos_proposta")
      .select("secoes, intro")
      .eq("tipo", "individualizacao_gas")
      .eq("ativo", true)
      .maybeSingle(),
  ]);

  const qtdApartamentos = gm?.qtd_apartamentos ?? 0;
  const pontosPorApartamento = gm?.pontos_por_apartamento ?? 1;
  const totalMedidores =
    gm?.qtd_hidrometros ?? qtdApartamentos * pontosPorApartamento;
  const valorGerenciamento = gm?.valor_por_hidrometro ?? 0;

  if (qtdApartamentos <= 0) {
    return new Response(
      "Preencha a quantidade de apartamentos antes de gerar o PDF.",
      { status: 400 },
    );
  }

  const cond = orc.condominios;
  const enderecoLinha = [
    cond?.endereco,
    cond?.cidade && cond?.uf ? `${cond.cidade}/${cond.uf}` : cond?.cidade,
  ]
    .filter(Boolean)
    .join(" - ");

  const [header, footer, watermark, fotoMedidor] = await Promise.all([
    assetDataUri("timbre-header.png"),
    assetDataUri("timbre-footer.png"),
    assetDataUri("timbre-watermark.png"),
    assetDataUri("foto-medidor-gas.png"),
  ]);

  const qtdTss = Math.max(1, Math.trunc(orc.qtd_tss ?? 1));
  const qtdTssTxt = qtdTssExtenso(qtdTss);
  const tssInstalacao = orc.incluir_tss
    ? INDIVIDUALIZACAO_GAS.tssInstalacaoFrag.replace(/\{qtd_tss\}/g, qtdTssTxt)
    : "";

  const buffer = await renderToBuffer(
    createElement(IndividualizacaoGasPdf, {
      numero: orc.numero,
      cidade: cond?.cidade ?? "Santos",
      dataExtenso: dataPorExtenso(orc.data_orcamento),
      condominioNome: cond?.nome ?? "",
      condominioEndereco: enderecoLinha,
      administradora: cond?.administradora ?? null,
      analiseTecnica:
        override?.intro?.trim() || INDIVIDUALIZACAO_GAS.analiseTecnicaPadrao,
      secoes: secoesEfetivas("individualizacao_gas", override?.secoes).map(
        (s) => ({
          ...s,
          corpo: s.corpo
            .replace(/\{vazao_gas\}/g, vazaoGas(orc.medidor_gas))
            .replace(/\{tss_instalacao\}/g, tssInstalacao)
            .replace(/\{qtd_tss\}/g, qtdTssTxt),
        }),
      ),
      prazo: orc.prazo?.trim() || INDIVIDUALIZACAO_GAS.prazoPadrao,
      pontosPorApartamento,
      totalMedidores,
      incluirTss: orc.incluir_tss,
      tssExecutivo: orc.incluir_tss
        ? INDIVIDUALIZACAO_GAS.tssExecutivoTexto.replace(
            /\{qtd_tss\}/g,
            qtdTssTxt,
          )
        : null,
      valorGerenciamento,
      opcoes,
      assets: { header, footer, watermark, fotoMedidor },
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
