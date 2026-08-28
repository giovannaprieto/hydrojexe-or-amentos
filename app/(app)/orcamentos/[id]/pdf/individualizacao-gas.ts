import { createElement } from "react";

import { renderToBuffer } from "@react-pdf/renderer";

import { IndividualizacaoGasPdf } from "@/components/pdf/individualizacao-gas-pdf";
import { dataPorExtenso } from "@/lib/data-extenso";
import {
  INDIVIDUALIZACAO_GAS,
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

type OrcIndivGas = {
  numero: string;
  data_orcamento: string;
  prazo: string | null;
  tss_opcoes: unknown;
  condominios: OrcGestaoCondominio;
};

export async function gerarPdfIndividualizacaoGas(
  supabase: DbClient,
  id: string,
  orc: OrcIndivGas,
): Promise<Response> {
  const opcoes = parseOpcoes(orc.tss_opcoes);
  if (opcoes.length === 0) {
    return new Response(
      "Preencha as opções de investimento antes de gerar o PDF.",
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
      secoes: secoesEfetivas("individualizacao_gas", override?.secoes),
      prazo: orc.prazo?.trim() || INDIVIDUALIZACAO_GAS.prazoPadrao,
      pontosPorApartamento,
      totalMedidores,
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
