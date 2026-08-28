import { NovaTabelaPrecos } from "@/components/nova-tabela-precos";
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
    <main className="flex flex-col gap-12">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="text-xl font-semibold">Tabela de preços</h1>
          {vigenciaAtual ? (
            <span className="text-sm text-black/60 dark:text-white/60">
              Vigente desde {formatDateBR(vigenciaAtual)}
            </span>
          ) : null}
        </div>

        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-black/60 dark:border-white/10 dark:text-white/60">
              <tr>
                <th className="px-3 py-2 font-medium">Item</th>
                {formasProprias.map((f) => (
                  <th key={f.id} className="px-3 py-2 text-right font-medium">
                    {f.nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itensAtivos.map((i) => (
                <tr
                  key={i.id}
                  className="border-b border-black/5 last:border-0 dark:border-white/5"
                >
                  <td className="whitespace-nowrap px-3 py-2">{i.nome}</td>
                  {formasProprias.map((f) => (
                    <td
                      key={f.id}
                      className="px-3 py-2 text-right tabular-nums text-black/80 dark:text-white/80"
                    >
                      {formatBRL(vigentes.get(`${i.id}__${f.id}`) ?? null)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {formasDerivadas.length > 0 ? (
          <p className="text-xs text-black/50 dark:text-white/50">
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
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Nova tabela de preços</h2>
        <p className="max-w-2xl text-sm text-black/60 dark:text-white/60">
          Informe a data de início e ajuste os valores (os campos vêm
          preenchidos com a tabela vigente). Ao salvar, a vigência anterior é
          encerrada nessa data e os novos valores passam a valer — orçamentos
          já criados não são afetados.
        </p>
        <NovaTabelaPrecos
          hoje={hoje}
          itens={itensAtivos.map((i) => ({ id: i.id, nome: i.nome }))}
          formas={formasProprias.map((f) => ({ id: f.id, nome: f.nome }))}
          atuais={Object.fromEntries(vigentes)}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Histórico</h2>
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-black/60 dark:border-white/10 dark:text-white/60">
              <tr>
                <th className="px-3 py-2 font-medium">Item</th>
                <th className="px-3 py-2 font-medium">Forma</th>
                <th className="px-3 py-2 text-right font-medium">Valor</th>
                <th className="px-3 py-2 font-medium">Início</th>
                <th className="px-3 py-2 font-medium">Fim</th>
              </tr>
            </thead>
            <tbody>
              {todosPrecos.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-black/5 last:border-0 dark:border-white/5"
                >
                  <td className="px-3 py-1.5">
                    {nomeItem.get(p.item_id) ?? "—"}
                  </td>
                  <td className="px-3 py-1.5">
                    {nomeForma.get(p.forma_pagamento_id) ?? "—"}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {formatBRL(p.valor)}
                  </td>
                  <td className="px-3 py-1.5">
                    {formatDateBR(p.vigencia_inicio)}
                  </td>
                  <td className="px-3 py-1.5 text-black/60 dark:text-white/60">
                    {p.vigencia_fim ? formatDateBR(p.vigencia_fim) : "vigente"}
                  </td>
                </tr>
              ))}
              {todosPrecos.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-4 text-center text-black/50 dark:text-white/50"
                  >
                    Nenhum preço cadastrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
