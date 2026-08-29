export const STATUS_OBRA = [
  { valor: "planejada", rotulo: "Planejada" },
  { valor: "em_andamento", rotulo: "Em andamento" },
  { valor: "concluida", rotulo: "Concluída" },
  { valor: "pausada", rotulo: "Pausada" },
  { valor: "cancelada", rotulo: "Cancelada" },
] as const;

export const VALORES_STATUS_OBRA = STATUS_OBRA.map((s) => s.valor) as string[];

export function rotuloStatusObra(v: string): string {
  return STATUS_OBRA.find((s) => s.valor === v)?.rotulo ?? v;
}

export const STATUS_APARTAMENTO = [
  { valor: "pendente", rotulo: "Pendente" },
  { valor: "agendado", rotulo: "Agendado" },
  { valor: "concluido", rotulo: "Concluído" },
  { valor: "impedido", rotulo: "Impedido" },
] as const;

export const TOM_STATUS_OBRA: Record<
  string,
  "neutral" | "info" | "success" | "warn" | "danger"
> = {
  planejada: "neutral",
  em_andamento: "info",
  concluida: "success",
  pausada: "warn",
  cancelada: "danger",
};
