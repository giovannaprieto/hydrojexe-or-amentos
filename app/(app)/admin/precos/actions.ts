"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { mensagemErroBanco, texto, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export async function aplicarNovaTabela(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const vigencia = texto(formData, "vigencia_inicio");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(vigencia)) {
    return { ok: false, error: "Informe uma data de vigência válida." };
  }

  const precos: Json[] = [];
  for (const [key, raw] of formData.entries()) {
    if (!key.startsWith("valor__")) continue;
    const [, itemId, formaId] = key.split("__");
    if (!itemId || !formaId) continue;

    const str = String(raw).trim().replace(",", ".");
    if (str === "") continue;

    const valor = Number(str);
    if (!Number.isFinite(valor) || valor < 0) {
      return { ok: false, error: "Há valores inválidos na tabela." };
    }
    precos.push({
      item_id: itemId,
      forma_pagamento_id: formaId,
      valor: Math.round(valor * 100) / 100,
    });
  }

  if (precos.length === 0) {
    return { ok: false, error: "Preencha ao menos um valor." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("aplicar_tabela_precos", {
    p_vigencia: vigencia,
    p_precos: precos,
  });
  if (error) return { ok: false, error: mensagemErroBanco(error) };

  revalidatePath("/admin/precos");
  const n = typeof data === "number" ? data : 0;
  return {
    ok: true,
    error: null,
    mensagem:
      n === 0
        ? "Nenhuma mudança: os valores eram iguais aos vigentes."
        : `Nova tabela aplicada — ${n} preço(s) alterado(s).`,
  };
}
