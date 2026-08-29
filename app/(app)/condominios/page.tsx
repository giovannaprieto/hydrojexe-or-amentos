import Link from "next/link";

import { IconPlus } from "@/components/icons";
import {
  Card,
  EmptyRow,
  LinkButton,
  PageHeader,
  TableWrap,
} from "@/components/ui-layout";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Condomínios · Hydrojexe" };

export default async function CondominiosPage({
  searchParams,
}: {
  searchParams: Promise<{ arquivados?: string }>;
}) {
  await requireUsuario();
  const verArquivados = (await searchParams).arquivados === "1";

  const supabase = await createClient();
  let query = supabase
    .from("condominios")
    .select("id, nome, cidade, uf, administradora, contato_nome, contato_telefone")
    .order("nome");
  query = verArquivados
    ? query.not("arquivado_em", "is", null)
    : query.is("arquivado_em", null);
  const { data: condominios } = await query;

  const lista = condominios ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo={verArquivados ? "Condomínios arquivados" : "Condomínios"}
        descricao={
          lista.length > 0
            ? `${lista.length} cliente(s).`
            : "Nada por aqui."
        }
        acoes={
          <>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- route handler de download, não é página */}
            <a
              href="/condominios/export"
              className="hj-btn hj-btn-secondary"
            >
              Exportar
            </a>
            <LinkButton href="/condominios/novo" variante="primary">
              <IconPlus />
              Novo condomínio
            </LinkButton>
          </>
        }
      />

      {verArquivados ? (
        <Link
          href="/condominios"
          className="w-fit text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ← voltar aos ativos
        </Link>
      ) : null}

      <Card plano>
        <TableWrap>
          <thead>
            <tr>
              <th>Nome</th>
              <th className="hidden sm:table-cell">Cidade/UF</th>
              <th className="hidden lg:table-cell">Administradora</th>
              <th>Contato</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link
                    href={`/condominios/${c.id}`}
                    className="font-medium text-navy-900 underline-offset-4 hover:text-brand-600 hover:underline"
                  >
                    {c.nome}
                  </Link>
                </td>
                <td className="hidden text-ink-600 sm:table-cell">
                  {[c.cidade, c.uf].filter(Boolean).join(" / ") || "—"}
                </td>
                <td className="hidden text-ink-600 lg:table-cell">
                  {c.administradora || "—"}
                </td>
                <td className="text-ink-600">
                  {[c.contato_nome, c.contato_telefone]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
              </tr>
            ))}
            {lista.length === 0 ? (
              <EmptyRow colSpan={4}>
                Nenhum condomínio cadastrado. Clique em “Novo condomínio”.
              </EmptyRow>
            ) : null}
          </tbody>
        </TableWrap>
      </Card>

      {!verArquivados ? (
        <Link
          href="/condominios?arquivados=1"
          className="w-fit text-xs font-medium text-ink-500 hover:text-brand-600"
        >
          Ver condomínios arquivados
        </Link>
      ) : null}
    </div>
  );
}
