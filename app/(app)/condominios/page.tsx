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

export default async function CondominiosPage() {
  await requireUsuario();

  const supabase = await createClient();
  const { data: condominios } = await supabase
    .from("condominios")
    .select("id, nome, cidade, uf, administradora, contato_nome, contato_telefone")
    .order("nome");

  const lista = condominios ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Condomínios"
        descricao={
          lista.length > 0
            ? `${lista.length} cliente(s) cadastrado(s).`
            : "Nenhum condomínio cadastrado ainda."
        }
        acoes={
          <LinkButton href="/condominios/novo" variante="primary">
            <IconPlus />
            Novo condomínio
          </LinkButton>
        }
      />

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
    </div>
  );
}
