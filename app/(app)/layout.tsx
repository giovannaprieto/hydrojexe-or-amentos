import { AppHeader } from "@/components/app-header";
import { requireUsuario } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await requireUsuario();

  return (
    <>
      <AppHeader usuario={usuario} />
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</div>
    </>
  );
}
