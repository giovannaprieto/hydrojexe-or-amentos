/** Estado padrão retornado pelas server actions de formulário. */
export type FormState = {
  ok: boolean;
  error: string | null;
  mensagem?: string;
};

export const emptyFormState: FormState = { ok: false, error: null };

/** Traduz códigos de erro do Postgres para mensagens em pt-BR. */
export function mensagemErroBanco(error: {
  code?: string;
  message: string;
}): string {
  switch (error.code) {
    case "23505":
      return "Já existe um registro com esse valor único (ex.: slug repetido, ou outro item já marcado como TSS).";
    case "23503":
      return "Não é possível excluir: há registros vinculados a este cadastro.";
    case "23514":
      return "Algum valor está fora das regras permitidas.";
    case "23502":
      return "Preencha todos os campos obrigatórios.";
    case "42501":
      return "Você não tem permissão para esta ação.";
    default:
      return error.message;
  }
}

export function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "").trim();
}

export function textoOuNulo(formData: FormData, campo: string): string | null {
  const v = texto(formData, campo);
  return v === "" ? null : v;
}

export function inteiro(formData: FormData, campo: string, padrao = 0): number {
  const v = Number(formData.get(campo));
  return Number.isFinite(v) ? Math.trunc(v) : padrao;
}

export function booleano(formData: FormData, campo: string): boolean {
  const v = formData.get(campo);
  return v === "on" || v === "true" || v === "1";
}
