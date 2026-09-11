import Link from "next/link";

import { IconGota, IconPdf, IconPlus } from "@/components/icons";
import { MiniTendencia } from "@/components/mini-tendencia";
import {
  Badge,
  Card,
  EmptyRow,
  LinkButton,
  StatusBadge,
  TableWrap,
  type TomBadge,
} from "@/components/ui-layout";
import { requireUsuario } from "@/lib/auth";
import { formatBRL, formatDateBR } from "@/lib/format";
import { TOM_STATUS_OBRA, rotuloStatusObra } from "@/lib/obras";
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

const DIAS_SEM_RESPOSTA = 7;
const DIAS_RASCUNHO_PARADO = 10;

/** orçamentos enviados parados há >= 7 dias, do mais parado ao menos */
function aguardandoResposta<
  T extends { enviado_em: string | null },
>(enviados: T[]): (T & { dias: number })[] {
  const agora = Date.now();
  return enviados
    .map((o) => {
      const t = o.enviado_em ? new Date(o.enviado_em).getTime() : agora;
      return { ...o, dias: Math.floor((agora - t) / 86_400_000) };
    })
    .filter((o) => o.dias >= DIAS_SEM_RESPOSTA)
    .sort((a, b) => b.dias - a.dias);
}

/** rascunhos sem movimento há mais de N dias */
function filtrarRascunhosParados<T extends { data_orcamento: string | null }>(
  rascunhos: T[],
): T[] {
  const agora = Date.now();
  return rascunhos.filter(
    (o) =>
      o.data_orcamento &&
      Math.floor((agora - new Date(o.data_orcamento).getTime()) / 86_400_000) >=
        DIAS_RASCUNHO_PARADO,
  );
}

type Periodo = "mes" | "trimestre" | "ano";
const PERIODOS: { valor: Periodo; rotulo: string }[] = [
  { valor: "mes", rotulo: "Mês" },
  { valor: "trimestre", rotulo: "Trimestre" },
  { valor: "ano", rotulo: "Ano" },
];

/** início (inclusive) do período selecionado, no formato YYYY-MM-DD */
function inicioPeriodo(periodo: Periodo): string {
  const hoje = new Date();
  const d =
    periodo === "ano"
      ? new Date(hoje.getFullYear(), 0, 1)
      : periodo === "trimestre"
        ? new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1)
        : new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  return d.toISOString().slice(0, 10);
}

function rotuloPeriodo(periodo: Periodo, mesAtual: string): string {
  if (periodo === "ano") return String(new Date().getFullYear());
  if (periodo === "trimestre") return "últimos 3 meses";
  return mesAtual;
}

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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const usuario = await requireUsuario();
  const { periodo: periodoParam } = await searchParams;
  const periodo: Periodo = PERIODOS.some((p) => p.valor === periodoParam)
    ? (periodoParam as Periodo)
    : "mes";
  const supabase = await createClient();

  const [{ data: orcamentos }, { count: totalCondominios }, { data: obras }] =
    await Promise.all([
      supabase
        .from("orcamentos")
        .select(
          "id, numero, data_orcamento, status, tipo_proposta, valor_total, enviado_em, condominios(nome)",
        )
        .is("arquivado_em", null)
        .order("data_orcamento", { ascending: false })
        .order("numero", { ascending: false }),
      supabase
        .from("condominios")
        .select("id", { count: "exact", head: true })
        .is("arquivado_em", null),
      supabase
        .from("obras")
        .select(
          "id, status, outros_custos, condominios(nome), orcamentos(valor_total)",
        )
        .not("status", "in", "(cancelada,concluida)")
        .order("created_at", { ascending: false }),
    ]);

  const lista = orcamentos ?? [];
  const porStatus = (s: string) => lista.filter((o) => o.status === s);
  const rascunhos = porStatus("rascunho");
  const enviados = porStatus("enviado");
  const aprovados = porStatus("aprovado");
  const recentes = lista.slice(0, 6);
  const semResposta = aguardandoResposta(enviados);

  const rascunhosParados = filtrarRascunhosParados(rascunhos);

  // Recortadas pelo período selecionado (Mês / Trimestre / Ano) -------------
  const inicio = inicioPeriodo(periodo);
  const noPeriodo = (o: { data_orcamento: string | null }) =>
    (o.data_orcamento ?? "") >= inicio;
  const criadosPeriodo = lista.filter(noPeriodo);
  const aprovadosPeriodo = aprovados.filter(noPeriodo);
  const enviadosPeriodo = enviados.filter(noPeriodo);
  const somaAprovados = aprovadosPeriodo.reduce(
    (a, o) => a + (o.valor_total ?? 0),
    0,
  );
  const somaEnviados = enviadosPeriodo.reduce(
    (a, o) => a + (o.valor_total ?? 0),
    0,
  );

  const conversao =
    enviadosPeriodo.length + aprovadosPeriodo.length > 0
      ? Math.round(
          (aprovadosPeriodo.length /
            (enviadosPeriodo.length + aprovadosPeriodo.length)) *
            100,
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
  const aprovadosMes = contaPorMes((s) => s === "aprovado");

  const mesAtual = MESES[new Date().getMonth()];
  const rotuloAtual = rotuloPeriodo(periodo, mesAtual);

  // Materiais das obras em andamento (para o custo acumulado) ---------------
  const obrasLista = obras ?? [];
  const obraIds = obrasLista.map((o) => o.id);
  const materiaisPorObra = new Map<string, number>();
  if (obraIds.length) {
    const { data: reqs } = await supabase
      .from("obra_requisicoes")
      .select("obra_id, valor_total")
      .in("obra_id", obraIds);
    for (const r of reqs ?? [])
      materiaisPorObra.set(
        r.obra_id,
        (materiaisPorObra.get(r.obra_id) ?? 0) + (r.valor_total ?? 0),
      );
  }
  const obrasResumo = obrasLista.slice(0, 4).map((o) => {
    const cond = o.condominios as unknown as { nome: string } | null;
    const orc = o.orcamentos as unknown as { valor_total: number | null } | null;
    const aprovado = orc?.valor_total ?? 0;
    const custo = (materiaisPorObra.get(o.id) ?? 0) + (o.outros_custos ?? 0);
    const variacao = aprovado > 0 ? Math.round(((aprovado - custo) / aprovado) * 100) : null;
    return { id: o.id, nome: cond?.nome ?? "—", status: o.status, aprovado, custo, variacao };
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="hj-page-title">Olá, {primeiroNome(usuario.nome)}</h1>
          <p className="hj-muted mt-1">Panorama comercial — referência de {rotuloAtual}.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-ink-200 bg-white p-0.5 shadow-[0_1px_2px_rgba(16,24,38,0.04)]">
            {PERIODOS.map((p) => (
              <Link
                key={p.valor}
                href={p.valor === "mes" ? "/" : `/?periodo=${p.valor}`}
                className={`rounded-[0.6rem] px-3 py-1.5 text-xs font-medium transition-colors ${
                  periodo === p.valor
                    ? "bg-navy-900 text-white"
                    : "text-ink-500 hover:text-navy-900"
                }`}
              >
                {p.rotulo}
              </Link>
            ))}
          </div>
          <LinkButton href="/orcamentos/novo" variante="primary">
            <IconPlus />
            Novo orçamento
          </LinkButton>
        </div>
      </div>

      {/* Hero — valor aprovado ------------------------------------------------ */}
      <div className="hj-hero relative overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-[#12293c] to-[#0d1a29] shadow-[0_18px_40px_rgba(13,26,41,0.28)]">
        <IconGota
          aria-hidden
          className="pointer-events-none absolute -right-5 -bottom-16 !size-64 text-white/[0.06]"
        />
        <IconGota
          aria-hidden
          className="pointer-events-none absolute top-4 left-10 !size-10 text-white/[0.08]"
        />
        <IconGota
          aria-hidden
          className="pointer-events-none absolute top-10 left-32 !size-7 text-white/[0.08]"
        />
        <div className="relative grid gap-8 p-7 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_220px_190px] lg:items-center">
          <div>
            <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-brand-300 uppercase">
              Valor aprovado · {rotuloAtual}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <IconGota className="!size-6 text-[#38d7f2]" />
              <span className="text-[2.6rem] leading-none font-semibold tracking-[-0.02em] text-white tabular-nums">
                {formatBRL(somaAprovados)}
              </span>
            </div>
            <p className="mt-3 text-sm text-white/50">
              Soma dos {aprovadosPeriodo.length} orçamento(s) aprovado(s), no valor à vista.
            </p>
          </div>
          <div className="hidden w-56 lg:block">
            <MiniTendencia valores={aprovadosMes} />
          </div>
          <div className="flex flex-col gap-4 border-white/10 pt-4 lg:border-l lg:pt-0 lg:pl-6">
            <div>
              <p className="text-xs text-white/50">Criados no período</p>
              <p className="mt-1 text-lg font-semibold text-white tabular-nums">
                {criadosPeriodo.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/50">Conversão</p>
              <p className="mt-1 text-lg font-semibold text-white tabular-nums">
                {conversao != null ? `${conversao}%` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/50">Em negociação</p>
              <p className="mt-1 text-lg font-semibold text-white tabular-nums">
                {formatBRL(somaEnviados)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Precisa de ação + Obras em andamento --------------------------------- */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="hj-card overflow-hidden">
          <div className="flex items-center gap-2.5 bg-gradient-to-b from-coral-50 to-white px-5 py-4">
            <span className="grid size-7 place-items-center rounded-lg bg-coral-200 text-coral-700">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M12 9v4M12 17h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              </svg>
            </span>
            <span className="hj-section-title">Precisa de ação</span>
            {semResposta.length + (rascunhosParados.length > 0 ? 1 : 0) > 0 ? (
              <Badge tom="coral">
                {semResposta.length + (rascunhosParados.length > 0 ? 1 : 0)}
              </Badge>
            ) : null}
          </div>
          <div className="flex flex-col px-5 pb-3">
            {semResposta.slice(0, 4).map((o) => {
              const cond = o.condominios as { nome: string } | null;
              return (
                <div
                  key={o.id}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-0.5 border-b border-ink-100 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy-900">
                      {cond?.nome ?? "—"}
                    </p>
                    <p className="truncate text-xs text-ink-400">
                      {o.numero} · {formatBRL(o.valor_total)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-coral-600 tabular-nums">
                    {o.dias} d
                  </span>
                  <Link
                    href={`/orcamentos/${o.id}`}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    Abrir
                  </Link>
                </div>
              );
            })}
            {rascunhosParados.length > 0 ? (
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-0.5 border-b border-ink-100 py-3 last:border-b-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy-900">
                    {rascunhosParados.length} rascunho(s) parado(s)
                  </p>
                  <p className="truncate text-xs text-ink-400">
                    {rascunhosParados
                      .slice(0, 3)
                      .map((o) => o.numero)
                      .join(", ")}{" "}
                    · há +{DIAS_RASCUNHO_PARADO} dias
                  </p>
                </div>
                <span className="text-sm font-semibold text-ink-400">—</span>
                <Link
                  href="/orcamentos"
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  Ver
                </Link>
              </div>
            ) : null}
            {semResposta.length === 0 && rascunhosParados.length === 0 ? (
              <p className="hj-muted py-6 text-center">Tudo em dia por aqui.</p>
            ) : null}
          </div>
        </div>

        <div className="hj-card overflow-hidden">
          <div className="hj-card-header">
            <span className="hj-card-title normal-case">Obras em andamento</span>
            <Link
              href="/obras"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Ver todas
            </Link>
          </div>
          <div className="flex flex-col px-5 pb-3">
            {obrasResumo.map((o) => (
              <div
                key={o.id}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-0.5 border-b border-ink-100 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy-900">{o.nome}</p>
                  <p className="truncate text-xs text-ink-400">
                    custo {formatBRL(o.custo)} · aprovado {formatBRL(o.aprovado)}
                  </p>
                </div>
                <Badge tom={TOM_STATUS_OBRA[o.status] as TomBadge}>
                  {rotuloStatusObra(o.status)}
                </Badge>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    o.variacao == null
                      ? "text-ink-400"
                      : o.variacao >= 0
                        ? "text-emerald-700"
                        : "text-red-600"
                  }`}
                >
                  {o.variacao == null ? "—" : `${o.variacao >= 0 ? "+" : ""}${o.variacao}%`}
                </span>
              </div>
            ))}
            {obrasResumo.length === 0 ? (
              <p className="hj-muted py-6 text-center">Nenhuma obra em andamento.</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Orçamentos recentes ---------------------------------------------------- */}
      <Card
        titulo="Orçamentos recentes"
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

      <p className="hj-hint">
        {totalCondominios ?? 0} condomínio(s) cadastrado(s) ·{" "}
        <Link href="/relatorios" className="text-brand-600 hover:text-brand-700">
          ver relatório completo
        </Link>
      </p>
    </div>
  );
}
