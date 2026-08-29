import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireUsuario();
  const { id } = await params;
  const supabase = await createClient();

  const { data: req } = await supabase
    .from("obra_requisicoes")
    .select("anexo_path")
    .eq("id", id)
    .maybeSingle();
  if (!req?.anexo_path) {
    return new Response("Anexo não encontrado.", { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from("requisicoes")
    .createSignedUrl(req.anexo_path, 60);
  if (error || !data) {
    return new Response("Não foi possível abrir o anexo.", { status: 500 });
  }
  return Response.redirect(data.signedUrl, 302);
}
