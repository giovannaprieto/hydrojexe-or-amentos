import { NovaTabelaPrecos } from "@/components/nova-tabela-precos";
import {
  Badge,
  Card,
  EmptyRow,
  PageHeader,
  TableWrap,
} from "@/components/ui-layout";
import { requireAdmin } from "@/lib/auth";
import { formatBRL, formatDateBR, hojeISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Preços · Hydrojexe" };

export default async function PrecosPage() {
  await requireAdmin();

  const hoje = hojeISO();
  const supabase = await createClient();

  const [{ data: itens }, { data: formas }, { data: precos }] =
    await Promise.all([
      supabase
        .from("itens_precificaveis")
        .select("id, nome, ordem, ativo")
        .order("ordem")
        .order("nome"),
      supabase
        .from("formas_pagamento")
        .select("id, nome, ordem, ativo, usa_preco_de_forma_id")
        .order("ordem"),
      supabase
        .from("precos")
        .select(
          "id, item_id, forma_pagamento_id, valor, vigencia_inicio, vigencia_fim",
        )
        .order("vigencia_inicio", { ascending: false })
        .order("item_id")
        .order("forma_pagamento_id"),
    ]);

  const todasFormas = formas ?? [];
  const todosItens = itens ?? [];
  const todosPrecos = precos ?? [];

  const itensAtivos = todosItens.filter((i) => i.ativo);
  const formasProprias = todasFormas.filter(
    (f) => f.ativo && !f.usa_preco_de_forma_id,
  );
  const formasDerivadas = todasFormas.filter(
    (f) => f.ativo && f.usa_preco_de_forma_id,
  );

  const nomeForma = new Map(todasFormas.map((f) => [f.id, f.nome]));
  const nomeItem = new Map(todosItens.map((i) => [i.id, i.nome]));

  const vigentes = new Map<string, number>();
  let vigenciaAtual: string | null = null;
  for (const p of todosPrecos) {
    const dentro =
      p.vigencia_inicio <= hoje &&
      (p.vigencia_fim == null || p.vigencia_fim > hoje);
    if (!dentro) continue;
    vigentes.set(`${p.item_id}__${p.forma_pagamento_id}`, p.valor);
    if (!vigenciaAtual || p.vigencia_inicio > vigenciaAtual) {
      vigenciaAtual = p.vigencia_inicio;
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Tabela de preços"
        descricao="Valor unitário de cada item por forma de pagamento."
        etiqueta={
          vigenciaAtual ? (
            <Badge tom="info">Vigente desde {formatDateBR(vigenciaAtual)}</Badge>
          ) : null
        }
      />

      <Card plano>
        <TableWrap>
          <thead>
            <tr>
              <th>Item</th>
              {formasProprias.map((f) => (
                <th key={f.id} className="text-right">
                  {f.nome}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {itensAtivos.map((i) => (
              <tr key={i.id}>
                <td className="font-medium whitespace-nowrap text-navy-900">
                  {i.nome}
                </td>
                {formasProprias.map((f) => (
                  <td key={f.id} className="text-right tabular-nums">
                    {formatBRL(vigentes.get(`${i.id}__${f.id}`) ?? null)}
                  </td>
                ))}
              </tr>
            ))}
            {itensAtivos.length === 0 ? (
              <EmptyRow colSpan={formasProprias.length + 1}>
                Nenhum item ativo.
              </EmptyRow>
            ) : null}
          </tbody>
        </TableWrap>
      </Card>

      {formasDerivadas.length > 0 ? (
        <p className="hj-hint -mt-4">
          {formasDerivadas
            .map(
              (f) =>
                `${f.nome} usa o preço de ${
                  f.usa_preco_de_forma_id
                    ? (nomeForma.get(f.usa_preco_de_forma_id) ?? "—")
                    : "—"
                }`,
            )
            .join(" · ")}
        </p>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="hj-section-title">Nova tabela de preços</h2>
        <p className="max-w-3xl hj-muted">
          Informe a data de início e ajuste os valores (os campos vêm
          preenchidos com a tabela vigente). Ao salvar, a vigência anterior é
          encerrada nessa data e os novos valores passam a valer — orçamentos já
          criados não são afetados.
        </p>
        <NovaTabelaPrecos
          hoje={hoje}
          itens={itensAtivos.map((i) => ({ id: i.id, nome: i.nome }))}
          formas={formasProprias.map((f) => ({ id: f.id, nome: f.nome }))}
          atuais={Object.fromEntries(vigentes)}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="hj-section-title">Histórico de vigências</h2>
        <Card plano>
          <TableWrap>
            <thead>
              <tr>
                <th>Item</th>
                <th>Forma</th>
                <th className="text-right">Valor</th>
                <th>Início</th>
                <th>Fim</th>
              </tr>
            </thead>
            <tbody>
              {todosPrecos.map((p) => (
                <tr key={p.id}>
                  <td>{nomeItem.get(p.item_id) ?? "—"}</td>
                  <td className="text-ink-600">
                    {nomeForma.get(p.forma_pagamento_id) ?? "—"}
                  </td>
                  <td className="text-right font-medium tabular-nums">
                    {formatBRL(p.valor)}
                  </td>
                  <td className="text-ink-600">
                    {formatDateBR(p.vigencia_inicio)}
                  </td>
                  <td>
                    {p.vigencia_fim ? (
                      <span className="text-ink-500">
                        {formatDateBR(p.vigencia_fim)}
                      </span>
                    ) : (
                      <Badge tom="success">Vigente</Badge>
                    )}
                  </td>
                </tr>
              ))}
              {todosPrecos.length === 0 ? (
                <EmptyRow colSpan={5}>Nenhum preço cadastrado.</EmptyRow>
              ) : null}
            </tbody>
          </TableWrap>
        </Card>
      </section>
    </div>
  );
}
