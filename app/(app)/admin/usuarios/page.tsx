import { CriarUsuarioForm } from "@/components/criar-usuario-form";
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

  return (
    <main className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Usuários</h1>
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-black/60 dark:border-white/10 dark:text-white/60">
              <tr>
                <th className="px-3 py-2 font-medium">Nome</th>
                <th className="px-3 py-2 font-medium">E-mail</th>
                <th className="px-3 py-2 font-medium">Perfil</th>
                <th className="px-3 py-2 font-medium">Ativo</th>
              </tr>
            </thead>
            <tbody>
              {(usuarios ?? []).map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-black/5 last:border-0 dark:border-white/5"
                >
                  <td className="px-3 py-2">{u.nome}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2 capitalize">{u.perfil}</td>
                  <td className="px-3 py-2">{u.ativo ? "sim" : "não"}</td>
                </tr>
              ))}
              {(usuarios ?? []).length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-4 text-center text-black/50 dark:text-white/50"
                  >
                    Nenhum usuário.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Novo usuário</h2>
        <CriarUsuarioForm />
      </section>
    </main>
  );
}
