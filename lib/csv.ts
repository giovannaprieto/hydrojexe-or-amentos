/** Monta um CSV pt-BR (separador ";", BOM) e devolve uma Response para download. */
function celula(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function respostaCsv(
  nomeArquivo: string,
  cabecalho: string[],
  linhas: unknown[][],
): Response {
  const corpo = [cabecalho, ...linhas]
    .map((l) => l.map(celula).join(";"))
    .join("\r\n");
  return new Response("﻿" + corpo, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      "Cache-Control": "no-store",
    },
  });
}
