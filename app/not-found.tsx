import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Página não encontrada · Hydrojexe" };

export default function NaoEncontrado() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-navy-950 px-6 text-center">
      <span className="inline-grid place-items-center rounded-2xl bg-white px-6 py-4 shadow-lg">
        <Image
          src="/logo-hydrojexe.png"
          alt="Hydrojexe"
          width={530}
          height={312}
          priority
          className="h-14 w-auto"
        />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-5xl font-semibold tracking-tight text-white">404</p>
        <p className="text-navy-200">Esta página não existe ou foi movida.</p>
      </div>
      <Link
        href="/"
        className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-100"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
