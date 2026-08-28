import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Entrar · Hydrojexe" };

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Hydrojexe · Orçamentos</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Acesso restrito. Entre com seu e-mail e senha.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
