import { requireUsuario } from "@/lib/auth";
import { respostaCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUsuario();
  const supabase = await createClient();

  const { data: condominios } = await supabase
    .from("condominios")
    .select(
      "id, nome, cnpj, cidade, uf, administradora, qtd_unidades, sindico_nome, contato_nome, contato_email, contato_telefone",
    )
    .is("arquivado_em", null)
    .order("nome");

  const lista = condominios ?? [];
  const ids = lista.map((c) => c.id);
  const contagem = new Map<string, number>();
  if (ids.length) {
    const { data: orcs } = await supabase
      .from("orcamentos")
      .select("condominio_id")
      .in("condominio_id", ids)
      .is("arquivado_em", null);
    for (const o of orcs ?? [])
      contagem.set(o.condominio_id, (contagem.get(o.condominio_id) ?? 0) + 1);
  }

  return respostaCsv(
    "condominios.csv",
    [
      "Nome",
      "CNPJ",
      "Cidade",
      "UF",
      "Administradora",
      "Qtd. unidades",
      "Síndico",
      "Contato",
      "E-mail",
      "Telefone",
      "Orçamentos",
    ],
    lista.map((c) => [
      c.nome,
      c.cnpj ?? "",
      c.cidade ?? "",
      c.uf ?? "",
      c.administradora ?? "",
      c.qtd_unidades ?? "",
      c.sindico_nome ?? "",
      c.contato_nome ?? "",
      c.contato_email ?? "",
      c.contato_telefone ?? "",
      contagem.get(c.id) ?? 0,
    ]),
  );
}
