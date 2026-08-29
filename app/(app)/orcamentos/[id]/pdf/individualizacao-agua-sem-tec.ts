import { createElement } from "react";

import { renderToBuffer } from "@react-pdf/renderer";

import { IndividualizacaoAguaSemTecPdf } from "@/components/pdf/individualizacao-agua-sem-tec-pdf";
import { dataPorExtenso } from "@/lib/data-extenso";
import {
  filtrarPorFormasVisiveis,
  parcelasOrigemPreco,
  parseFormasVisiveis,
} from "@/lib/formas-pagamento";
import {
  INDIVIDUALIZACAO_AGUA_SEM_TEC,
  secoesEfetivas,
  type TssOpcao,
} from "@/lib/modelos-proposta";
import { assetDataUri } from "@/lib/pdf-assets";
import type { OrcGestaoCondominio } from "@/app/(app)/orcamentos/[id]/pdf/gestao";
import type { createClient } from "@/lib/supabase/server";

type DbClient = Awaited<ReturnType<typeof createClient>>;

function parseOpcoes(raw: unknown): TssOpcao[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => {
      const o = x as { valor?: unknown; parcelas?: unknown };
      return {
        valor: Number(o.valor) || 0,
        parcelas: Math.trunc(Number(o.parcelas) || 0),
      };
    })
    .filter((o) => o.valor > 0)
    .slice(0, 4);
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

type OrcAguaSemTec = {
  numero: string;
  data_orcamento: string;
  prazo: string | null;
  tss_opcoes: unknown;
  formas_pagamento_visiveis: unknown;
  parcelas_custom: unknown;
  condominios: OrcGestaoCondominio;
};

export async function gerarPdfIndividualizacaoAguaSemTec(
  supabase: DbClient,
  id: string,
  orc: OrcAguaSemTec,
): Promise<Response> {
  const congeladas = parseOpcoes(orc.tss_opcoes);
  if (congeladas.length === 0) {
    return new Response(
      "Preencha as opções de investimento antes de gerar o PDF.",
      { status: 400 },
    );
  }

  const valorPorParcelas = new Map(congeladas.map((o) => [o.parcelas, o.valor]));
  const especial = !!orc.condominios?.parcelamento_especial;
  const efetivas: TssOpcao[] = especial
    ? congeladas.map((o) => ({
        parcelas: o.parcelas,
        valor:
          valorPorParcelas.get(parcelasOrigemPreco(o.parcelas, true)) ?? o.valor,
      }))
    : congeladas;

  const base12 =
    valorPorParcelas.get(12) ??
    congeladas[congeladas.length - 1]?.valor ??
    0;
  const opcoes = [
    ...filtrarPorFormasVisiveis(
      efetivas,
      parseFormasVisiveis(orc.formas_pagamento_visiveis),
    ),
    ...parseParcelasCustom(orc.parcelas_custom).map((n) => ({
      valor: base12,
      parcelas: n,
    })),
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
      .select("secoes")
      .eq("tipo", "individualizacao_agua_sem_tecnologia")
      .eq("ativo", true)
      .maybeSingle(),
  ]);

  const qtdApartamentos = gm?.qtd_apartamentos ?? 0;
  const hidrometrosPorApartamento = gm?.pontos_por_apartamento ?? 1;
  const totalHidrometros =
    gm?.qtd_hidrometros ?? qtdApartamentos * hidrometrosPorApartamento;
  const valorGestaoMensal = gm?.valor_por_hidrometro ?? 0;

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

  const [
    header,
    footer,
    watermark,
    fotoMedidor,
    logoInmetro,
    fotoDemonstrativo,
  ] = await Promise.all([
    assetDataUri("timbre-header.png"),
    assetDataUri("timbre-footer.png"),
    assetDataUri("timbre-watermark.png"),
    assetDataUri("foto-medidor-visual.jpg"),
    assetDataUri("logo-inmetro.jpg"),
    assetDataUri("foto-demonstrativo.jpg"),
  ]);

  const buffer = await renderToBuffer(
    createElement(IndividualizacaoAguaSemTecPdf, {
      numero: orc.numero,
      cidade: cond?.cidade ?? "Santos",
      dataExtenso: dataPorExtenso(orc.data_orcamento),
      condominioNome: cond?.nome ?? "",
      condominioEndereco: enderecoLinha,
      administradora: cond?.administradora ?? null,
      secoes: secoesEfetivas(
        "individualizacao_agua_sem_tecnologia",
        override?.secoes,
      ),
      prazo: orc.prazo?.trim() || INDIVIDUALIZACAO_AGUA_SEM_TEC.prazoPadrao,
      totalHidrometros,
      hidrometrosPorApartamento,
      valorGestaoMensal,
      opcoes,
      assets: {
        header,
        footer,
        watermark,
        fotoMedidor,
        logoInmetro,
        fotoDemonstrativo,
      },
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
