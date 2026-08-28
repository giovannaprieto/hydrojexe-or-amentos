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
    <div className="flex min-h-full flex-col items-center justify-center bg-navy-950 px-6 py-16">
      <div className="w-full max-w-sm">
        {/* Marca ----------------------------------------------------------- */}
        <div className="flex flex-col items-center text-center">
          <span className="inline-grid place-items-center rounded-2xl bg-white px-7 py-6 shadow-lg">
            <Image
              src="/logo-hydrojexe.png"
              alt="Hydrojexe"
              width={530}
              height={312}
              priority
              className="h-20 w-auto"
            />
          </span>

          <p className="mt-6 text-[0.7rem] leading-relaxed tracking-[0.18em] text-navy-300 uppercase">
            Hydrojexe — Individualização de Medição de Água e Gás Ltda.
          </p>
          <p className="mt-1 text-xs font-semibold tracking-[0.32em] text-brand-300 uppercase">
            Orçamentos
          </p>
        </div>

        {/* Acesso -------------------------------------------------------------- */}
        <div className="mt-10 rounded-2xl bg-white p-7 shadow-xl">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
