import Link from "next/link";

import { IconPdf, IconPlus, IconWallet } from "@/components/icons";
import { MiniTendencia } from "@/components/mini-tendencia";
import {
  Card,
  EmptyRow,
  LinkButton,
  PageHeader,
  StatusBadge,
  TableWrap,
} from "@/components/ui-layout";
import { requireUsuario } from "@/lib/auth";
import { formatBRL, formatDateBR } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard · Hydrojexe" };

const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0];
const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/** rótulos dos últimos 6 meses (YYYY-MM) até o mês atual */
function ultimosSeisMeses(): { chave: string; rotulo: string }[] {
  const out: { chave: string; rotulo: string }[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 5; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({
      chave: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`,
      rotulo: MESES[m.getMonth()],
    });
  }
  return out;
}

export default async function DashboardPage() {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const [{ data: orcamentos }, { count: totalCondominios }] = await Promise.all([
    supabase
      .from("orcamentos")
      .select("id, numero, data_orcamento, status, tipo_proposta, valor_total, condominios(nome)")
      .order("data_orcamento", { ascending: false })
      .order("numero", { ascending: false }),
    supabase.from("condominios").select("id", { count: "exact", head: true }),
  ]);

  const lista = orcamentos ?? [];
  const porStatus = (s: string) => lista.filter((o) => o.status === s);
  const rascunhos = porStatus("rascunho");
  const enviados = porStatus("enviado");
  const aprovados = porStatus("aprovado");
  const somaAprovados = aprovados.reduce((a, o) => a + (o.valor_total ?? 0), 0);
  const recentes = lista.slice(0, 8);
  const conversao =
    enviados.length + aprovados.length > 0
      ? Math.round(
          (aprovados.length / (enviados.length + aprovados.length)) * 100,
        )
      : null;

  const meses = ultimosSeisMeses();
  const contaPorMes = (filtro: (s: string) => boolean) =>
    meses.map(
      (m) =>
        lista.filter(
          (o) =>
            (o.data_orcamento ?? "").slice(0, 7) === m.chave &&
            filtro(o.status),
        ).length,
    );
  const criadosMes = contaPorMes(() => true);
  const aprovadosMes = contaPorMes((s) => s === "aprovado");
  const enviadosMes = contaPorMes((s) => s === "enviado" || s === "aprovado");

  const mesAtual = MESES[new Date().getMonth()];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo={`Olá, ${primeiroNome(usuario.nome)}`}
        descricao={`Panorama comercial — referência de ${mesAtual}.`}
        acoes={
          <LinkButton href="/orcamentos/novo" variante="primary">
            <IconPlus />
            Novo orçamento
          </LinkButton>
        }
      />

      {/* Indicadores com tendência --------------------------------------- */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <IndicadorTendencia
          rotulo="Orçamentos criados"
          valor={String(criadosMes[criadosMes.length - 1])}
          nota={`${lista.length} no total`}
          serie={criadosMes}
        />
        <IndicadorTendencia
          rotulo="Enviados (em aberto)"
          valor={String(enviados.length)}
          nota={`${rascunhos.length} rascunho(s)`}
          serie={enviadosMes}
        />
        <IndicadorTendencia
          rotulo="Aprovados no mês"
          valor={String(aprovadosMes[aprovadosMes.length - 1])}
          nota={`${aprovados.length} no total`}
          serie={aprovadosMes}
        />
        <div className="hj-card hj-card-pad flex flex-col justify-between gap-3">
          <p className="hj-label">Taxa de conversão</p>
          <p className="hj-stat">{conversao != null ? `${conversao}%` : "—"}</p>
          <p className="text-xs text-ink-500">aprovados ÷ (enviados + aprovados)</p>
        </div>
      </div>

      {/* Valor aprovado + recentes ------------------------------------------ */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="hj-card relative overflow-hidden bg-navy-900">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-12 size-56 rounded-full bg-brand-500/20 blur-3xl"
          />
          <div className="relative flex h-full flex-col justify-between gap-6 p-6">
            <div className="flex items-center gap-2.5 text-brand-200">
              <IconWallet className="size-5" />
              <span className="text-xs font-semibold tracking-widest uppercase">
                Valor aprovado
              </span>
            </div>
            <div>
              <p className="text-3xl font-semibold tracking-[-0.02em] text-white tabular-nums">
                {formatBRL(somaAprovados)}
              </p>
              <p className="mt-1.5 text-sm text-navy-300">
                Soma dos {aprovados.length} orçamento(s) aprovado(s), no valor à
                vista.
              </p>
            </div>
          </div>
        </div>

        <Card
          titulo="Orçamentos recentes"
          className="lg:col-span-2"
          plano
          acoes={
            <Link
              href="/orcamentos"
              className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
            >
              Ver todos
            </Link>
          }
        >
          <TableWrap>
            <thead>
              <tr>
                <th>Número</th>
                <th>Condomínio</th>
                <th className="hidden sm:table-cell">Status</th>
                <th className="text-right">Total à vista</th>
                <th className="hidden md:table-cell text-right">Data</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {recentes.map((o) => {
                const cond = o.condominios as { nome: string } | null;
                return (
                  <tr key={o.id}>
                    <td>
                      <Link
                        href={`/orcamentos/${o.id}`}
                        className="font-medium text-navy-900 underline-offset-4 hover:text-brand-600 hover:underline"
                      >
                        {o.numero}
                      </Link>
                    </td>
                    <td>{cond?.nome ?? "—"}</td>
                    <td className="hidden sm:table-cell">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="text-right font-medium tabular-nums">
                      {formatBRL(o.valor_total)}
                    </td>
                    <td className="hidden text-right text-ink-500 md:table-cell">
                      {formatDateBR(o.data_orcamento)}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/orcamentos/${o.id}/pdf`}
                        title="Abrir PDF"
                        className="inline-grid size-7 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-navy-800"
                      >
                        <IconPdf className="size-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {recentes.length === 0 ? (
                <EmptyRow colSpan={6}>
                  Nenhum orçamento ainda — comece criando o primeiro.
                </EmptyRow>
              ) : null}
            </tbody>
          </TableWrap>
        </Card>
      </div>

      <p className="hj-hint">
        {totalCondominios ?? 0} condomínio(s) cadastrado(s) ·{" "}
        <Link href="/relatorios" className="text-brand-600 hover:text-brand-700">
          ver relatório completo
        </Link>
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function IndicadorTendencia({
  rotulo,
  valor,
  nota,
  serie,
}: {
  rotulo: string;
  valor: string;
  nota: string;
  serie: number[];
}) {
  return (
    <div className="hj-card hj-card-pad flex flex-col gap-2">
      <p className="hj-label">{rotulo}</p>
      <div className="flex items-end justify-between gap-3">
        <p className="hj-stat">{valor}</p>
        <div className="w-24 shrink-0">
          <MiniTendencia valores={serie} />
        </div>
      </div>
      <p className="text-xs text-ink-500">{nota}</p>
    </div>
  );
}
