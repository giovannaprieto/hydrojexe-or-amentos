import { createElement } from "react";

import { renderToBuffer } from "@react-pdf/renderer";

import { GestaoMensalPdf } from "@/components/pdf/gestao-mensal-pdf";
import { dataPorExtenso } from "@/lib/data-extenso";
import { MODELOS_GESTAO, secoesEfetivas } from "@/lib/modelos-proposta";
import { assetDataUri } from "@/lib/pdf-assets";
import type { createClient } from "@/lib/supabase/server";

type DbClient = Awaited<ReturnType<typeof createClient>>;

export type OrcGestaoCondominio = {
  nome: string;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  administradora: string | null;
  parcelamento_especial?: boolean | null;
  parcelamento_especial_modo?: string | null;
} | null;

type OrcGestao = {
  numero: string;
  data_orcamento: string;
  tipo_proposta: string;
  condominios: OrcGestaoCondominio;
};

export async function gerarPdfGestao(
  supabase: DbClient,
  id: string,
  orc: OrcGestao,
): Promise<Response> {
  const modelo = MODELOS_GESTAO[orc.tipo_proposta];
  if (!modelo) {
    return new Response("Tipo de proposta inválido.", { status: 400 });
  }

  const [{ data: gm }, { data: override }] = await Promise.all([
    supabase
      .from("gerenciamento_mensal")
      .select(
        "valor_por_hidrometro, qtd_apartamentos, pontos_por_apartamento, qtd_hidrometros, valor_total_mensal",
      )
      .eq("orcamento_id", id)
      .maybeSingle(),
    supabase
      .from("modelos_proposta")
      .select("secoes")
      .eq("tipo", orc.tipo_proposta)
      .eq("ativo", true)
      .maybeSingle(),
  ]);

  const qtdApartamentos = gm?.qtd_apartamentos ?? 0;
  const pontosPorApartamento = gm?.pontos_por_apartamento ?? 1;
  const valorPorApartamento = gm?.valor_por_hidrometro ?? 0;
  const totalPontos =
    gm?.qtd_hidrometros ?? qtdApartamentos * pontosPorApartamento;
  const valorTotalMensal =
    gm?.valor_total_mensal ?? totalPontos * valorPorApartamento;

  if (qtdApartamentos <= 0 || valorPorApartamento <= 0) {
    return new Response(
      "Preencha a quantidade de apartamentos e o valor mensal antes de gerar o PDF.",
      { status: 400 },
    );
  }

  const secoes = secoesEfetivas(orc.tipo_proposta, override?.secoes);

  const cond = orc.condominios;
  const enderecoLinha = [
    cond?.endereco,
    cond?.cidade && cond?.uf ? `${cond.cidade}/${cond.uf}` : cond?.cidade,
  ]
    .filter(Boolean)
    .join(" - ");

  const [header, footer, watermark, foto] = await Promise.all([
    assetDataUri("timbre-header.png"),
    assetDataUri("timbre-footer.png"),
    assetDataUri("timbre-watermark.png"),
    assetDataUri("foto-demonstrativo.jpg"),
  ]);

  const buffer = await renderToBuffer(
    createElement(GestaoMensalPdf, {
      numero: orc.numero,
      cidade: cond?.cidade ?? "Santos",
      dataExtenso: dataPorExtenso(orc.data_orcamento),
      condominioNome: cond?.nome ?? "",
      condominioEndereco: enderecoLinha,
      administradora: cond?.administradora ?? null,
      sistema: modelo.sistema,
      ponto: modelo.ponto,
      pontoPlural: modelo.pontoPlural,
      ref: modelo.ref,
      secoes,
      demonstrativos: modelo.demonstrativos,
      outrasDisposicoes: modelo.outrasDisposicoes,
      assets: { header, footer, watermark, foto },
      qtdApartamentos,
      pontosPorApartamento,
      valorPorApartamento,
      totalPontos,
      valorTotalMensal,
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
