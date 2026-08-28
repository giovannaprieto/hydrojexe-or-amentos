import Image from "next/image";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Entrar · Hydrojexe" };

const DESTAQUES = [
  "Propostas montadas em minutos",
  "Tabela de preços controlada e versionada",
  "PDF gerado no padrão da Hydrojexe",
];

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <div className="grid min-h-full lg:grid-cols-[1.05fr_1fr]">
      {/* Painel institucional ------------------------------------------------- */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-navy-950 p-12 lg:flex xl:p-16">
        {/* fundo: gradiente + malha + brilho da marca */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 -right-24 size-[26rem] rounded-full bg-brand-500/20 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-24 size-[24rem] rounded-full bg-brand-400/10 blur-[120px]"
        />

        <div className="relative">
          <span className="inline-grid place-items-center rounded-2xl bg-white px-6 py-5 shadow-lg ring-1 ring-white/20">
            <Image
              src="/logo-hydrojexe.png"
              alt="Hydrojexe"
              width={530}
              height={312}
              priority
              className="h-20 w-auto"
            />
          </span>
        </div>

        <div className="relative max-w-lg">
          <span className="inline-block h-1 w-14 rounded-full bg-brand-400" />
          <h2 className="mt-6 text-[2.6rem] leading-[1.1] font-semibold tracking-tight text-white text-balance">
            Individualização de água e gás, do orçamento ao PDF.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-navy-200">
            A plataforma interna da Hydrojexe para montar propostas, manter a
            tabela de preços e entregar o documento final no padrão da empresa.
          </p>

          <ul className="mt-8 flex flex-col gap-3">
            {DESTAQUES.map((d) => (
              <li key={d} className="flex items-center gap-3 text-navy-100">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-500/20 text-brand-200">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="size-3.5"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                {d}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs tracking-[0.18em] text-navy-400 uppercase">
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
