import Image from "next/image";
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
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Painel institucional ------------------------------------------------- */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 p-12 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-brand-500/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-brand-400/10 blur-3xl"
        />

        <div className="relative">
          <span className="inline-grid place-items-center rounded-xl bg-white px-5 py-4 shadow-sm">
            <Image
              src="/logo-hydrojexe.png"
              alt="Hydrojexe"
              width={530}
              height={312}
              priority
              className="h-16 w-auto"
            />
          </span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight text-white">
            Sistema de orçamentos de individualização de água e gás
          </h2>
          <p className="mt-4 text-navy-200">
            Monte propostas, controle a tabela de preços e gere o PDF no padrão
            da Hydrojexe — tudo em um só lugar.
          </p>
        </div>

        <p className="relative text-xs tracking-wide text-navy-400 uppercase">
          Hydrojexe · Individualização de medição de água e gás
        </p>
      </section>

      {/* Formulário ------------------------------------------------------------ */}
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Image
              src="/logo-hydrojexe.png"
              alt="Hydrojexe"
              width={530}
              height={312}
              priority
              className="h-14 w-auto"
            />
          </div>

          <h1 className="hj-page-title">Entrar</h1>
          <p className="mt-1.5 hj-muted">
            Acesso restrito. Use seu e-mail e senha.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </section>
    </div>
  );
}
