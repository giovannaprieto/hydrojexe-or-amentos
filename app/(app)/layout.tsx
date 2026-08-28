import { AppSidebar } from "@/components/app-sidebar";
import { requireUsuario } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await requireUsuario();

  return (
    <div className="min-h-full lg:pl-72">
      <AppSidebar usuario={usuario} />
      <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}
