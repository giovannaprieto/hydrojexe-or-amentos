import { gerarPdfDoOrcamento } from "@/app/(app)/orcamentos/[id]/pdf/route";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!UUID.test(token)) {
    return new Response("Link inválido.", { status: 404 });
  }

  // service role: sem sessão, mas só acha o orçamento se o token bater
  const admin = createAdminClient();
  const { data: orc } = await admin
    .from("orcamentos")
    .select("id, arquivado_em")
    .eq("token_publico", token)
    .maybeSingle();

  if (!orc || orc.arquivado_em) {
    return new Response("Orçamento não encontrado.", { status: 404 });
  }

  return gerarPdfDoOrcamento(
    admin as unknown as Parameters<typeof gerarPdfDoOrcamento>[0],
    orc.id,
  );
}
