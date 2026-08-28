import { createElement } from "react";

import { renderToBuffer } from "@react-pdf/renderer";

import { TssLightPdf } from "@/components/pdf/tss-light-pdf";
import { dataPorExtenso } from "@/lib/data-extenso";
import {
  TSS_LIGHT,
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

type OrcTss = {
  numero: string;
  data_orcamento: string;
  prazo: string | null;
  qtd_equipamentos: number | null;
  tss_opcoes: unknown;
  condominios: OrcGestaoCondominio;
};

export async function gerarPdfTssLight(
  supabase: DbClient,
  orc: OrcTss,
): Promise<Response> {
  const qtdEquipamentos = orc.qtd_equipamentos ?? 1;
  const opcoes = parseOpcoes(orc.tss_opcoes);
  if (opcoes.length === 0) {
    return new Response(
      "Preencha as opções de investimento antes de gerar o PDF.",
      { status: 400 },
    );
  }

  const { data: override } = await supabase
    .from("modelos_proposta")
    .select("secoes")
    .eq("tipo", "tss_light")
    .eq("ativo", true)
    .maybeSingle();
  const secoes = secoesEfetivas("tss_light", override?.secoes);

  const cond = orc.condominios;
  const enderecoLinha = [
    cond?.endereco,
    cond?.cidade && cond?.uf ? `${cond.cidade}/${cond.uf}` : cond?.cidade,
  ]
    .filter(Boolean)
    .join(" - ");

  const [header, footer, watermark, techem] = await Promise.all([
    assetDataUri("timbre-header.png"),
    assetDataUri("timbre-footer.png"),
    assetDataUri("timbre-watermark.png"),
    assetDataUri("logo-techem.png"),
  ]);

  const buffer = await renderToBuffer(
    createElement(TssLightPdf, {
      numero: orc.numero,
      cidade: cond?.cidade ?? "Santos",
      dataExtenso: dataPorExtenso(orc.data_orcamento),
      condominioNome: cond?.nome ?? "",
      condominioEndereco: enderecoLinha,
      administradora: cond?.administradora ?? null,
      prazo: orc.prazo?.trim() || TSS_LIGHT.prazoPadrao,
      secoes,
      qtdEquipamentos,
      opcoes,
      assets: { header, footer, watermark, techem },
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
