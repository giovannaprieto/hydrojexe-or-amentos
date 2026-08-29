import Link from "next/link";
import { notFound } from "next/navigation";

import {
  arquivarCondominio,
  desarquivarCondominio,
  excluirCondominio,
} from "@/app/(app)/condominios/actions";
import { CondominioForm } from "@/components/condominio-form";
import { IconTrash } from "@/components/icons";
import { Timeline, type LinhaTimeline } from "@/components/timeline";
import {
  Alert,
  Badge,
  Card,
  DataList,
  EmptyRow,
  PageHeader,
  StatusBadge,
  TableWrap,
} from "@/components/ui-layout";
import { requireUsuario } from "@/lib/auth";
import { formatBRL, formatDateBR } from "@/lib/format";
import { rotuloTipoProposta } from "@/lib/orcamento-tipos";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Condomínio · Hydrojexe" };

const ROTULO_STATUS: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
  cancelado: "Cancelado",
};

export default async function CondominioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string; editar?: string }>;
}) {
  const usuario = await requireUsuario();
  const isAdmin = usuario.perfil === "admin";
  const { id } = await params;
  const { erro, editar } = await searchParams;

  const supabase = await createClient();
  const { data: condominio } = await supabase
    .from("condominios")
    .select("*")
    .eq("id", id)
    .single();
  if (!condominio) notFound();

  const { data: orcamentosRaw } = await supabase
    .from("orcamentos")
    .select(
      "id, numero, data_orcamento, status, tipo_proposta, valor_total, usuarios!criado_por(nome)",
    )
    .eq("condominio_id", id)
    .order("data_orcamento", { ascending: false })
    .order("numero", { ascending: false });
  const orcamentos = orcamentosRaw ?? [];
  const orcIds = orcamentos.map((o) => o.id);

  // histórico: alterações dos orçamentos deste condomínio + do próprio cadastro
  const idsExpr = orcIds.map((x) => `"${x}"`).join(",");
  const orExpr = idsExpr
    ? `orcamento_id.in.(${idsExpr}),and(entidade.eq.condominios,entidade_id.eq.${id})`
    : `and(entidade.eq.condominios,entidade_id.eq.${id})`;
  const { data: hist } = await supabase
    .from("historico_alteracoes")
    .select(
      "id, orcamento_id, acao, descricao, valor_antes, valor_depois, alterado_em, usuarios!alterado_por(nome)",
    )
    .or(orExpr)
    .order("alterado_em", { ascending: false })
    .limit(200);

  const { data: snaps } = orcIds.length
    ? await supabase
        .from("orcamento_snapshots")
        .select(
          "id, orcamento_id, status, valor_total, criado_em, dados, usuarios!criado_por(nome)",
        )
        .in("orcamento_id", orcIds)
        .order("criado_em", { ascending: false })
    : { data: [] };

  const numeroPorId = new Map(orcamentos.map((o) => [o.id, o.numero]));

  const linhas: LinhaTimeline[] = [
    ...(hist ?? []).map((h) => ({
      id: `h-${h.id}`,
      titulo: h.descricao ?? h.acao,
      quando: h.alterado_em,
      autor: (h.usuarios as { nome: string } | null)?.nome ?? null,
      tom: (h.acao === "criar"
        ? "criar"
        : h.acao === "excluir"
          ? "excluir"
          : "atualizar") as LinhaTimeline["tom"],
      contexto: h.orcamento_id
        ? `Orç. ${numeroPorId.get(h.orcamento_id) ?? "?"}`
        : "Cadastro",
      antes: h.valor_antes,
      depois: h.valor_depois,
    })),
    ...(snaps ?? []).map((s) => ({
      id: `s-${s.id}`,
      titulo: `Versão registrada — ${ROTULO_STATUS[s.status] ?? s.status} (${formatBRL(s.valor_total)})`,
      quando: s.criado_em,
      autor:
        (s.usuarios as unknown as { nome: string } | null)?.nome ?? null,
      tom: "snapshot" as const,
      contexto: `Orç. ${numeroPorId.get(s.orcamento_id) ?? "?"}`,
      depois: s.dados,
    })),
  ].sort((a, b) => (a.quando < b.quando ? 1 : -1));

  const endereco = [
    condominio.endereco,
    [condominio.cidade, condominio.uf].filter(Boolean).join(" / "),
  ]
    .filter(Boolean)
    .join(" — ");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo={condominio.nome}
        voltar={{ href: "/condominios", rotulo: "Condomínios" }}
        etiqueta={
          orcamentos.length > 0 ? (
            <Badge tom="info">{orcamentos.length} orçamento(s)</Badge>
          ) : null
        }
        descricao={endereco || undefined}
        acoes={
          <Link
            href={`/condominios/${id}?editar=1`}
            className="hj-btn hj-btn-secondary"
          >
            Editar cadastro
          </Link>
        }
      />

      {erro ? <Alert tom="error">{erro}</Alert> : null}

      <Card titulo="Dados cadastrais">
        <DataList
          colunas={3}
          itens={[
            { rotulo: "Nome", valor: condominio.nome },
            { rotulo: "CNPJ", valor: condominio.cnpj ?? "—" },
            {
              rotulo: "Qtd. de unidades",
              valor: condominio.qtd_unidades ?? "—",
            },
            { rotulo: "Endereço", valor: endereco || "—" },
            { rotulo: "Administradora", valor: condominio.administradora ?? "—" },
            { rotulo: "Síndico", valor: condominio.sindico_nome ?? "—" },
            { rotulo: "Contato", valor: condominio.contato_nome ?? "—" },
            { rotulo: "E-mail", valor: condominio.contato_email ?? "—" },
            { rotulo: "Telefone", valor: condominio.contato_telefone ?? "—" },
            {
              rotulo: "Observações",
              valor: condominio.observacoes ?? "—",
            },
          ]}
        />
      </Card>

      {editar ? (
        <section className="flex flex-col gap-3">
          <h2 className="hj-section-title">Editar cadastro</h2>
          <CondominioForm inicial={condominio} />
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="hj-section-title">Orçamentos</h2>
        <Card plano>
          <TableWrap>
            <thead>
              <tr>
                <th>Número</th>
                <th className="hidden sm:table-cell">Data</th>
                <th className="hidden md:table-cell">Tipo</th>
                <th className="hidden lg:table-cell">Responsável</th>
                <th>Status</th>
                <th className="text-right">Total à vista</th>
              </tr>
            </thead>
            <tbody>
              {orcamentos.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link
                      href={`/orcamentos/${o.id}`}
                      className="font-medium text-navy-900 underline-offset-4 hover:text-brand-600 hover:underline"
                    >
                      {o.numero}
                    </Link>
                  </td>
                  <td className="hidden text-ink-500 sm:table-cell">
                    {formatDateBR(o.data_orcamento)}
                  </td>
                  <td className="hidden text-ink-600 md:table-cell">
                    {rotuloTipoProposta(o.tipo_proposta)}
                  </td>
                  <td className="hidden text-ink-600 lg:table-cell">
                    {(o.usuarios as { nome: string } | null)?.nome ?? "—"}
                  </td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="text-right font-medium tabular-nums">
                    {formatBRL(o.valor_total)}
                  </td>
                </tr>
              ))}
              {orcamentos.length === 0 ? (
                <EmptyRow colSpan={6}>
                  Nenhum orçamento para este condomínio ainda.
                </EmptyRow>
              ) : null}
            </tbody>
          </TableWrap>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="hj-section-title">Histórico</h2>
        <Timeline
          linhas={linhas}
          vazio="Sem movimentações registradas para este condomínio."
        />
      </section>

      <section className="flex flex-wrap items-center gap-3 border-t border-ink-200 pt-6">
        {condominio.arquivado_em ? (
          <form action={desarquivarCondominio}>
            <input type="hidden" name="id" value={condominio.id} />
            <button type="submit" className="hj-btn hj-btn-secondary">
              Desarquivar
            </button>
          </form>
        ) : (
          <form action={arquivarCondominio}>
            <input type="hidden" name="id" value={condominio.id} />
            <button type="submit" className="hj-btn hj-btn-secondary">
              Arquivar condomínio
            </button>
          </form>
        )}
        {isAdmin ? (
          <form action={excluirCondominio}>
            <input type="hidden" name="id" value={condominio.id} />
            <button type="submit" className="hj-btn hj-btn-danger">
              <IconTrash />
              Excluir definitivamente
            </button>
          </form>
        ) : null}
        <span className="hj-hint">
          Arquivar tira das listas sem apagar nada.
          {isAdmin && orcamentos.length > 0
            ? " Excluir é bloqueado pelo banco se houver orçamentos."
            : ""}
        </span>
      </section>
    </div>
  );
}
