/**
 * Quebra um bloco de texto em linhas para os PDFs.
 *
 * Normaliza terminadores de linha (\r\n / \r → \n) e reduz sequências de
 * linhas em branco a no máximo uma — os textos-modelo são editados em
 * <textarea>, que no Windows grava \r\n, e a substituição de marcadores
 * pode juntar quebras, gerando espaçamento exagerado entre parágrafos.
 */
export function linhasParagrafo(texto: string | null | undefined): string[] {
  return (texto ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n");
}
