import Link from "next/link";
import type { ReactNode } from "react";

import {
  IconBuilding,
  IconCheck,
  IconClock,
  IconOrcamento,
  IconPlus,
  IconSend,
  IconWallet,
} from "@/components/icons";
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
import { rotuloTipoProposta } from "@/lib/orcamento-tipos";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard · Hydrojexe" };

const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0];

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
  const recentes = lista.slice(0, 6);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo={`Olá, ${primeiroNome(usuario.nome)}`}
        descricao="Visão geral dos orçamentos da Hydrojexe."
        acoes={
          <LinkButton href="/orcamentos/novo" variante="primary">
            <IconPlus />
            Novo orçamento
          </LinkButton>
        }
      />

      {/* Indicadores ---------------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          rotulo="Total de orçamentos"
          valor={String(lista.length)}
          nota={`${totalCondominios ?? 0} condomínio(s) cadastrado(s)`}
          icone={<IconOrcamento />}
          tom="navy"
        />
        <Indicador
          rotulo="Em andamento"
          valor={String(rascunhos.length)}
          nota="Rascunhos aguardando envio"
          icone={<IconClock />}
          tom="amber"
        />
        <Indicador
          rotulo="Enviados"
          valor={String(enviados.length)}
          nota="Aguardando resposta do cliente"
          icone={<IconSend />}
          tom="brand"
        />
        <Indicador
          rotulo="Aprovados"
          valor={String(aprovados.length)}
          nota="Propostas fechadas"
          icone={<IconCheck />}
          tom="emerald"
        />
      </div>

      {/* Valor aprovado + atalhos --------------------------------------------- */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="hj-card overflow-hidden bg-navy-900 lg:col-span-1">
          <div className="flex h-full flex-col justify-between gap-6 p-6">
            <div className="flex items-center gap-2.5 text-brand-200">
              <IconWallet className="size-5" />
              <span className="text-xs font-semibold tracking-widest uppercase">
                Valor aprovado
              </span>
            </div>
            <div>
              <p className="text-3xl font-semibold tracking-tight text-white">
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
          titulo="Atalhos"
          className="lg:col-span-2"
          descricao="Acesso rápido às áreas mais usadas."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Atalho
              href="/orcamentos"
              titulo="Orçamentos"
              descricao="Consultar, editar e gerar PDF"
              icone={<IconOrcamento />}
            />
            <Atalho
              href="/condominios"
              titulo="Condomínios"
              descricao="Cadastro de clientes"
              icone={<IconBuilding />}
            />
            {usuario.perfil === "admin" ? (
              <>
                <Atalho
                  href="/admin/precos"
                  titulo="Tabela de preços"
                  descricao="Valores vigentes por forma de pagamento"
                  icone={<IconWallet />}
                />
                <Atalho
                  href="/admin/textos"
                  titulo="Textos-modelo"
                  descricao="Conteúdo fixo das propostas"
                  icone={<IconCheck />}
                />
              </>
            ) : null}
          </div>
        </Card>
      </div>

      {/* Atividade recente ---------------------------------------------------- */}
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
              <th className="hidden sm:table-cell">Tipo</th>
              <th>Status</th>
              <th className="text-right">Total à vista</th>
              <th className="hidden sm:table-cell">Data</th>
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
                  <td className="hidden text-ink-600 sm:table-cell">
                    {rotuloTipoProposta(o.tipo_proposta)}
                  </td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="text-right font-medium tabular-nums">
                    {formatBRL(o.valor_total)}
                  </td>
                  <td className="hidden text-ink-500 sm:table-cell">
                    {formatDateBR(o.data_orcamento)}
                  </td>
                </tr>
              );
            })}
            {recentes.length === 0 ? (
              <EmptyRow colSpan={6}>
                Nenhum orçamento ainda. Comece criando o primeiro.
              </EmptyRow>
            ) : null}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const TONS = {
  navy: "bg-navy-100 text-navy-700",
  brand: "bg-brand-100 text-brand-700",
  amber: "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
} as const;

function Indicador({
  rotulo,
  valor,
  nota,
  icone,
  tom,
}: {
  rotulo: string;
  valor: string;
  nota: string;
  icone: ReactNode;
  tom: keyof typeof TONS;
}) {
  return (
    <div className="hj-card hj-card-pad flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className="hj-label">{rotulo}</p>
        <p className="text-3xl font-semibold tracking-tight text-navy-900 tabular-nums">
          {valor}
        </p>
        <p className="text-xs text-ink-500">{nota}</p>
      </div>
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-lg ${TONS[tom]}`}
      >
        {icone}
      </span>
    </div>
  );
}

function Atalho({
  href,
  titulo,
  descricao,
  icone,
}: {
  href: string;
  titulo: string;
  descricao: string;
  icone: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg border border-ink-200 px-4 py-3 transition-colors hover:border-brand-300 hover:bg-brand-50/60"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
        {icone}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-navy-900">{titulo}</span>
        <span className="block truncate text-xs text-ink-500">{descricao}</span>
      </span>
    </Link>
  );
}
