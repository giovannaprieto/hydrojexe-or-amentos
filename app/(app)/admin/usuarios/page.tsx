import { CriarUsuarioForm } from "@/components/criar-usuario-form";
import {
  Badge,
  Card,
  EmptyRow,
  PageHeader,
  TableWrap,
} from "@/components/ui-layout";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Usuários · Hydrojexe" };

export default async function UsuariosPage() {
  await requireAdmin();

  const supabase = await createClient();
  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nome, email, perfil, ativo, created_at")
    .order("created_at", { ascending: true });

  const lista = usuarios ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo="Usuários"
        descricao="Só o administrador cria contas. Não há cadastro público."
      />

      <Card plano>
        <TableWrap>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((u) => (
              <tr key={u.id}>
                <td className="font-medium text-navy-900">{u.nome}</td>
                <td className="text-ink-600">{u.email}</td>
                <td>
                  <Badge tom={u.perfil === "admin" ? "info" : "neutral"}>
                    <span className="capitalize">{u.perfil}</span>
                  </Badge>
                </td>
                <td>
                  <Badge tom={u.ativo ? "success" : "danger"}>
                    {u.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
              </tr>
            ))}
            {lista.length === 0 ? (
              <EmptyRow colSpan={4}>Nenhum usuário.</EmptyRow>
            ) : null}
          </tbody>
        </TableWrap>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="hj-section-title">Novo usuário</h2>
        <CriarUsuarioForm />
      </section>
    </div>
  );
}
