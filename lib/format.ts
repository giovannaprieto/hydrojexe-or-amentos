const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** 1234.5 -> "R$ 1.234,50" */
export function formatBRL(valor: number | null | undefined): string {
  if (valor == null || Number.isNaN(valor)) return "—";
  return brl.format(valor);
}

/** "2026-08-27" -> "27/08/2026" */
export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/** Data de hoje em ISO local (YYYY-MM-DD). */
export function hojeISO(): string {
  const agora = new Date();
  const off = agora.getTimezoneOffset() * 60000;
  return new Date(agora.getTime() - off).toISOString().slice(0, 10);
}
