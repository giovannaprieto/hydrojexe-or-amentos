import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Imagens do timbre/fotos não mudam entre requisições — lê do disco e
// converte para data URI uma vez por processo (persiste em execuções "quentes").
const cache = new Map<string, string>();

export async function assetDataUri(nome: string): Promise<string> {
  const hit = cache.get(nome);
  if (hit) return hit;

  const buf = await readFile(join(process.cwd(), "assets", nome));
  const mime =
    nome.endsWith(".jpg") || nome.endsWith(".jpeg")
      ? "image/jpeg"
      : "image/png";
  const uri = `data:${mime};base64,${buf.toString("base64")}`;
  cache.set(nome, uri);
  return uri;
}
