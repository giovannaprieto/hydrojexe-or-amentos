import { requireUsuario } from "@/lib/auth";
import { respostaCsv } from "@/lib/csv";
import { rotuloTipoProposta } from "@/lib/orcamento-tipos";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ROTULO_STATUS: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
  cancelado: "Cancelado",
};

function texto(v: string | null): string {
  return (v ?? "").trim();
}

export async function GET(req: Request) {
  await requireUsuario();
  const supabase = await createClient();
  const url = new URL(req.url);
  const q = texto(url.searchParams.get("q"));
  const status = texto(url.searchParams.get("status"));
  const tipo = texto(url.searchParams.get("tipo"));
  const responsavel = texto(url.searchParams.get("responsavel"));
  const de = texto(url.searchParams.get("de"));
  const ate = texto(url.searchParams.get("ate"));

  let condominioIds: string[] | null = null;
  if (q) {
    const termo = `%${q}%`;
    const { data: conds } = await supabase
      .from("condominios")
      .select("id")
      .or(
        `nome.ilike.${termo},cnpj.ilike.${termo},administradora.ilike.${termo}`,
      );
    condominioIds = (conds ?? []).map((c) => c.id);
  }

  let query = supabase
    .from("orcamentos")
    .select(
      "numero, data_orcamento, status, tipo_proposta, valor_total, condominios(nome, administradora), usuarios!criado_por(nome)",
    )
    .is("arquivado_em", null)
    .order("data_orcamento", { ascending: false });

  if (status) query = query.eq("status", status);
  if (tipo) query = query.eq("tipo_proposta", tipo);
  if (responsavel) query = query.eq("criado_por", responsavel);
  if (de) query = query.gte("data_orcamento", de);
  if (ate) query = query.lte("data_orcamento", ate);
  if (q) {
    const ids = (condominioIds ?? []).map((id) => `"${id}"`).join(",");
    query = query.or(
      ids
        ? `numero.ilike.%${q}%,condominio_id.in.(${ids})`
        : `numero.ilike.%${q}%`,
    );
  }

  const { data } = await query;

  return respostaCsv(
    "orcamentos.csv",
    [
      "Número",
      "Data",
      "Condomínio",
      "Administradora",
      "Tipo",
      "Status",
      "Responsável",
      "Total à vista",
    ],
    (data ?? []).map((o) => {
      const c = o.condominios as {
        nome: string;
        administradora: string | null;
      } | null;
      return [
        o.numero,
        o.data_orcamento,
        c?.nome ?? "",
        c?.administradora ?? "",
        rotuloTipoProposta(o.tipo_proposta),
        ROTULO_STATUS[o.status] ?? o.status,
        (o.usuarios as { nome: string } | null)?.nome ?? "",
        o.valor_total ?? 0,
      ];
    }),
  );
}
