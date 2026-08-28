"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUsuario } from "@/lib/auth";
import {
  booleano,
  mensagemErroBanco,
  texto,
  textoOuNulo,
  type FormState,
} from "@/lib/forms";
import { diffCampos, registrarHistorico } from "@/lib/historico";
import { calcularOrcamento, type TipoInput } from "@/lib/orcamento-calc";
import { VALORES_TIPO_PROPOSTA } from "@/lib/orcamento-tipos";
import {
  precosCongeladosPorForma,
  precosVigentesPorForma,
} from "@/lib/orcamento-precos";
import { createClient } from "@/lib/supabase/server";

const STATUS = ["rascunho", "enviado", "aprovado", "recusado", "cancelado"];

function anoDoNumero(numero: string): number {
  const m = numero.match(/(\d{4})\s*$/);
  return m ? Number(m[1]) : new Date().getFullYear();
}

function numeroDecimal(formData: FormData, campo: string): number {
  const s = String(formData.get(campo) ?? "").trim().replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function parseParcelasCustom(formData: FormData): number[] {
  try {
    const arr = JSON.parse(texto(formData, "parcelas_custom"));
    if (!Array.isArray(arr)) return [];
    return [
      ...new Set(
        arr
          .map((n) => Math.trunc(Number(n)))
          .filter((n) => Number.isFinite(n) && n >= 2),
      ),
    ].sort((a, b) => a - b);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Criar (rascunho) + redirect para o builder
// ---------------------------------------------------------------------------
export async function criarOrcamento(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const condominio_id = texto(formData, "condominio_id");
  const numero = texto(formData, "numero");
  const data_orcamento = texto(formData, "data_orcamento");
  const valor_por_hidrometro = numeroDecimal(formData, "valor_por_hidrometro");

  const tipo_proposta = texto(formData, "tipo_proposta") || "completa";

  if (!condominio_id) return { ok: false, error: "Escolha o condomínio." };
  if (!numero) return { ok: false, error: "Informe o número do orçamento." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data_orcamento)) {
    return { ok: false, error: "Data do orçamento inválida." };
  }
  if (!VALORES_TIPO_PROPOSTA.includes(tipo_proposta)) {
    return { ok: false, error: "Tipo de proposta inválido." };
  }

  const { data: padrao } = await supabase
    .from("templates_texto")
    .select("id")
    .eq("is_padrao", true)
    .maybeSingle();

  const { data: orc, error } = await supabase
    .from("orcamentos")
    .insert({
      numero,
      ano: anoDoNumero(numero),
      data_orcamento,
      condominio_id,
      template_texto_id: padrao?.id ?? null,
      status: "rascunho",
      tipo_proposta,
      incluir_tss: booleano(formData, "incluir_tss"),
      parcelas_custom: parseParcelasCustom(formData),
      tss_opcoes: [],
      prazo: textoOuNulo(formData, "prazo"),
      observacoes: textoOuNulo(formData, "observacoes"),
      criado_por: usuario.id,
      atualizado_por: usuario.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: mensagemErroBanco(error) };

  await supabase.from("gerenciamento_mensal").insert({
    orcamento_id: orc.id,
    valor_por_hidrometro,
  });

  await registrarHistorico(supabase, {
    orcamento_id: orc.id,
    entidade: "orcamentos",
    entidade_id: orc.id,
    acao: "criar",
    descricao: `Orçamento ${numero} criado`,
    alterado_por: usuario.id,
  });

  revalidatePath("/orcamentos");
  redirect(`/orcamentos/${orc.id}`);
}

// ---------------------------------------------------------------------------
// Cabeçalho (dados gerais + status + valor do gerenciamento)
// ---------------------------------------------------------------------------
export async function atualizarCabecalho(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const id = texto(formData, "id");
  if (!id) return { ok: false, error: "Registro inválido." };

  const { data: atual } = await supabase
    .from("orcamentos")
    .select(
      "numero, data_orcamento, condominio_id, status, tipo_proposta, incluir_tss, parcelas_custom, prazo, observacoes",
    )
    .eq("id", id)
    .single();
  if (!atual) return { ok: false, error: "Orçamento não encontrado." };
  const { data: gmAntes } = await supabase
    .from("gerenciamento_mensal")
    .select("valor_por_hidrometro")
    .eq("orcamento_id", id)
    .maybeSingle();

  const numero = texto(formData, "numero");
  const data_orcamento = texto(formData, "data_orcamento");
  const status = texto(formData, "status");
  if (!numero) return { ok: false, error: "Informe o número do orçamento." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data_orcamento)) {
    return { ok: false, error: "Data do orçamento inválida." };
  }
  if (!STATUS.includes(status)) return { ok: false, error: "Status inválido." };

  const tipo_proposta = texto(formData, "tipo_proposta") || atual.tipo_proposta;
  if (!VALORES_TIPO_PROPOSTA.includes(tipo_proposta)) {
    return { ok: false, error: "Tipo de proposta inválido." };
  }

  const novos = {
    numero,
    data_orcamento,
    condominio_id: texto(formData, "condominio_id"),
    status,
    tipo_proposta,
    incluir_tss: booleano(formData, "incluir_tss"),
    parcelas_custom: parseParcelasCustom(formData),
    prazo: textoOuNulo(formData, "prazo"),
    observacoes: textoOuNulo(formData, "observacoes"),
  };

  const { error } = await supabase
    .from("orcamentos")
    .update({ ...novos, ano: anoDoNumero(numero), atualizado_por: usuario.id })
    .eq("id", id);
  if (error) return { ok: false, error: mensagemErroBanco(error) };

  const novoValorHidro = numeroDecimal(formData, "valor_por_hidrometro");
  await supabase
    .from("gerenciamento_mensal")
    .update({ valor_por_hidrometro: novoValorHidro })
    .eq("orcamento_id", id);

  const dif = diffCampos(
    { ...atual, valor_por_hidrometro: gmAntes?.valor_por_hidrometro ?? 0 },
    { ...novos, valor_por_hidrometro: novoValorHidro },
  );
  if (dif.campos.length > 0) {
    const soStatus = dif.campos.length === 1 && dif.campos[0] === "status";
    await registrarHistorico(supabase, {
      orcamento_id: id,
      entidade: "orcamentos",
      entidade_id: id,
      acao: "atualizar",
      campo: dif.campos.join(", "),
      valor_antes: dif.antes,
      valor_depois: dif.depois,
      descricao: soStatus
        ? `Status alterado para “${status}”`
        : `Dados gerais atualizados (${dif.campos.join(", ")})`,
      alterado_por: usuario.id,
    });
  }

  revalidatePath(`/orcamentos/${id}`);
  revalidatePath("/orcamentos");
  return { ok: true, error: null, mensagem: "Cabeçalho salvo." };
}

// ---------------------------------------------------------------------------
// Salvar a montagem (tipos + composição) — calcula e CONGELA os preços
// de TODAS as formas próprias. Snapshots = valores à vista.
// ---------------------------------------------------------------------------
type PayloadTipo = {
  nome: string;
  unidades: number;
  itens: { item_id: string; quantidade: number }[];
};
type Payload = {
  tipos: PayloadTipo[];
  gerenciamento: {
    valor_por_hidrometro: number;
    qtd_hidrometros_override: number | null;
  };
};

export async function salvarOrcamento(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const id = texto(formData, "id");
  if (!id) return { ok: false, error: "Registro inválido." };

  let payload: Payload;
  try {
    payload = JSON.parse(texto(formData, "payload")) as Payload;
  } catch {
    return { ok: false, error: "Não foi possível ler os dados do formulário." };
  }

  const tipos: TipoInput[] = (payload.tipos ?? [])
    .map((t) => ({
      nome: String(t.nome ?? "").trim(),
      unidades: Math.trunc(Number(t.unidades) || 0),
      itens: (t.itens ?? [])
        .map((ci) => ({
          item_id: String(ci.item_id ?? ""),
          quantidade: Math.trunc(Number(ci.quantidade) || 0),
        }))
        .filter((ci) => ci.item_id && ci.quantidade > 0),
    }))
    .filter((t) => t.nome !== "");

  if (tipos.length === 0) {
    return { ok: false, error: "Adicione ao menos um tipo de apartamento com nome." };
  }
  if (tipos.some((t) => t.unidades <= 0)) {
    return { ok: false, error: "Cada tipo de apartamento precisa de ao menos 1 unidade." };
  }

  const { data: orc } = await supabase
    .from("orcamentos")
    .select("id, data_orcamento, incluir_tss, total_unidades, valor_total")
    .eq("id", id)
    .single();
  if (!orc) return { ok: false, error: "Orçamento não encontrado." };

  const { data: gmAtual } = await supabase
    .from("gerenciamento_mensal")
    .select("valor_por_hidrometro")
    .eq("orcamento_id", id)
    .maybeSingle();
  const valorPorHidrometro = gmAtual?.valor_por_hidrometro ?? 0;

  const [{ data: itensCat }, { data: formasRaw }] = await Promise.all([
    supabase.from("itens_precificaveis").select("id, unidade, is_tss"),
    supabase
      .from("formas_pagamento")
      .select("id, slug, ativo, usa_preco_de_forma_id")
      .eq("ativo", true)
      .is("usa_preco_de_forma_id", null)
      .order("ordem"),
  ]);
  const catalogo = itensCat ?? [];
  const formasProprias = formasRaw ?? [];
  const tssItem = catalogo.find((i) => i.is_tss);
  const itensPonto = catalogo.filter((i) => i.unidade === "ponto").map((i) => i.id);
  const itensTss = catalogo.filter((i) => i.is_tss).map((i) => i.id);

  const referenciados = new Set<string>();
  for (const t of tipos) for (const ci of t.itens) referenciados.add(ci.item_id);
  const alvo = new Set([...referenciados].filter((x) => !itensTss.includes(x)));
  if (tssItem && orc.incluir_tss) alvo.add(tssItem.id);
  const alvoIds = [...alvo];

  const [congPorForma, vigPorForma] = await Promise.all([
    precosCongeladosPorForma(supabase, id),
    precosVigentesPorForma(
      supabase,
      formasProprias.map((f) => f.id),
      alvoIds,
      orc.data_orcamento,
    ),
  ]);

  // preço unitário por (forma -> item) + linhas para congelar
  const precoPorForma = new Map<string, Record<string, number>>();
  const congelarLinhas: {
    orcamento_id: string;
    item_id: string;
    forma_pagamento_id: string;
    valor_unitario: number;
    preco_id: string | null;
  }[] = [];
  const semPrecoAVista: string[] = [];

  for (const f of formasProprias) {
    const cong = congPorForma.get(f.id) ?? new Map();
    const vig = vigPorForma.get(f.id) ?? new Map();

    const precoUnit: Record<string, number> = {};
    for (const itemId of alvoIds) {
      const p = cong.get(itemId) ?? vig.get(itemId);
      precoUnit[itemId] = p?.valor ?? 0;
      if (!p && f.slug === "a_vista") semPrecoAVista.push(itemId);
      congelarLinhas.push({
        orcamento_id: id,
        item_id: itemId,
        forma_pagamento_id: f.id,
        valor_unitario: p?.valor ?? 0,
        preco_id: p?.preco_id ?? null,
      });
    }
    precoPorForma.set(f.id, precoUnit);
  }

  // snapshot = à vista (ou a 1ª forma própria, se não houver "a_vista")
  const formaBase =
    formasProprias.find((f) => f.slug === "a_vista") ?? formasProprias[0];
  const precoBase = formaBase
    ? (precoPorForma.get(formaBase.id) ?? {})
    : {};

  const resultado = calcularOrcamento({
    tipos,
    precoUnit: precoBase,
    incluirTss: orc.incluir_tss,
    tssValor:
      orc.incluir_tss && tssItem ? (precoBase[tssItem.id] ?? 0) : 0,
    itensPonto,
    itensTss,
    valorPorHidrometro,
    qtdHidrometrosOverride:
      payload.gerenciamento?.qtd_hidrometros_override ?? null,
  });

  // --- persistência (1 transação via função Postgres) -------------------
  const pTipos = tipos.map((t, i) => ({
    nome: t.nome,
    unidades: t.unidades,
    ordem: i,
    valor_por_apartamento: resultado.tipos[i].valorPorApartamento,
    itens: t.itens.map((ci, j) => ({
      item_id: ci.item_id,
      quantidade: ci.quantidade,
      ordem: j,
    })),
  }));

  const valorTssSnapshot =
    orc.incluir_tss && tssItem ? (precoBase[tssItem.id] ?? 0) : 0;

  const { error: rpcErr } = await supabase.rpc("salvar_montagem_orcamento", {
    p_id: id,
    p_tipos: pTipos,
    p_congelados: congelarLinhas.map((l) => ({
      item_id: l.item_id,
      forma_pagamento_id: l.forma_pagamento_id,
      valor_unitario: l.valor_unitario,
      preco_id: l.preco_id,
    })),
    p_total_unidades: resultado.totalUnidades,
    p_valor_tss: valorTssSnapshot,
    p_valor_total: resultado.valorTotal,
    p_gm_qtd: resultado.qtdHidrometros,
    p_gm_total_mensal: resultado.valorTotalMensal,
    p_hist: {
      alterado_por: usuario.id,
      descricao: `Composição salva — total à vista ${resultado.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
      valor_antes: {
        total_unidades: orc.total_unidades,
        valor_total: orc.valor_total,
      },
      valor_depois: {
        total_unidades: resultado.totalUnidades,
        valor_total: resultado.valorTotal,
        tipos: resultado.tipos.map((t) => ({
          nome: t.nome,
          unidades: t.unidades,
          valor_por_apartamento: t.valorPorApartamento,
        })),
      },
    },
  });
  if (rpcErr) return { ok: false, error: mensagemErroBanco(rpcErr) };

  revalidatePath(`/orcamentos/${id}`);
  revalidatePath("/orcamentos");

  const aviso =
    semPrecoAVista.length > 0
      ? ` Atenção: ${semPrecoAVista.length} item(ns) sem preço à vista na tabela (contados como R$ 0).`
      : "";
  return {
    ok: true,
    error: null,
    mensagem: `Orçamento salvo. Total à vista ${resultado.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.${aviso}`,
  };
}

// ---------------------------------------------------------------------------
// Gestão mensal (água / gás) — fluxo enxuto: qtd de apartamentos × valor/mês
// ---------------------------------------------------------------------------
export async function salvarGestaoMensal(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const id = texto(formData, "id");
  if (!id) return { ok: false, error: "Registro inválido." };

  const { data: orc } = await supabase
    .from("orcamentos")
    .select("id, tipo_proposta, total_unidades, valor_total")
    .eq("id", id)
    .single();
  if (!orc) return { ok: false, error: "Orçamento não encontrado." };
  if (
    orc.tipo_proposta !== "gestao_mensal_agua" &&
    orc.tipo_proposta !== "gestao_mensal_gas"
  ) {
    return { ok: false, error: "Este orçamento não é de gestão mensal." };
  }

  const qtdApartamentos = Math.trunc(
    numeroDecimal(formData, "qtd_apartamentos"),
  );
  const pontosPorApartamento =
    Math.trunc(numeroDecimal(formData, "pontos_por_apartamento")) || 1;
  const valorPorApartamento = numeroDecimal(formData, "valor_por_apartamento");

  if (qtdApartamentos <= 0) {
    return { ok: false, error: "Informe a quantidade de apartamentos." };
  }
  if (pontosPorApartamento <= 0) {
    return { ok: false, error: "Pontos por apartamento inválido." };
  }
  if (valorPorApartamento <= 0) {
    return { ok: false, error: "Informe o valor mensal por apartamento." };
  }

  const totalPontos = qtdApartamentos * pontosPorApartamento;
  const valorTotalMensal = Math.round(totalPontos * valorPorApartamento * 100) / 100;

  const { error: gmErr } = await supabase
    .from("gerenciamento_mensal")
    .update({
      valor_por_hidrometro: valorPorApartamento,
      qtd_apartamentos: qtdApartamentos,
      pontos_por_apartamento: pontosPorApartamento,
      qtd_hidrometros: totalPontos,
      valor_total_mensal: valorTotalMensal,
    })
    .eq("orcamento_id", id);
  if (gmErr) return { ok: false, error: mensagemErroBanco(gmErr) };

  await supabase
    .from("orcamentos")
    .update({
      total_unidades: qtdApartamentos,
      valor_tss: 0,
      valor_total: valorTotalMensal,
      atualizado_por: usuario.id,
    })
    .eq("id", id);

  await registrarHistorico(supabase, {
    orcamento_id: id,
    entidade: "gerenciamento_mensal",
    entidade_id: id,
    acao: "atualizar",
    campo: "gestao_mensal",
    valor_antes: {
      total_unidades: orc.total_unidades,
      valor_total: orc.valor_total,
    },
    valor_depois: {
      qtd_apartamentos: qtdApartamentos,
      pontos_por_apartamento: pontosPorApartamento,
      valor_por_apartamento: valorPorApartamento,
      valor_total_mensal: valorTotalMensal,
    },
    descricao: `Gestão mensal salva — ${totalPontos} ponto(s), total mensal ${valorTotalMensal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
    alterado_por: usuario.id,
  });

  revalidatePath(`/orcamentos/${id}`);
  revalidatePath("/orcamentos");
  return {
    ok: true,
    error: null,
    mensagem: `Salvo. Total mensal ${valorTotalMensal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`,
  };
}

// ---------------------------------------------------------------------------
// TSS Light — qtd de equipamentos + até 4 opções (valor + nº de parcelas)
// ---------------------------------------------------------------------------
export async function salvarTssLight(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const id = texto(formData, "id");
  if (!id) return { ok: false, error: "Registro inválido." };

  const { data: orc } = await supabase
    .from("orcamentos")
    .select("id, tipo_proposta, valor_total")
    .eq("id", id)
    .single();
  if (!orc) return { ok: false, error: "Orçamento não encontrado." };
  if (orc.tipo_proposta !== "tss_light") {
    return { ok: false, error: "Este orçamento não é do tipo TSS Light." };
  }

  const qtdEquipamentos = Math.trunc(numeroDecimal(formData, "qtd_equipamentos"));
  if (qtdEquipamentos <= 0) {
    return { ok: false, error: "Informe a quantidade de equipamentos." };
  }

  let brutas: unknown;
  try {
    brutas = JSON.parse(texto(formData, "opcoes"));
  } catch {
    return { ok: false, error: "Não foi possível ler as opções." };
  }
  if (!Array.isArray(brutas) || brutas.length === 0) {
    return { ok: false, error: "Adicione ao menos uma opção de investimento." };
  }
  if (brutas.length > 4) {
    return { ok: false, error: "No máximo 4 opções." };
  }

  const opcoes: { valor: number; parcelas: number }[] = [];
  for (const raw of brutas) {
    const o = raw as { valor?: unknown; parcelas?: unknown };
    const valor = Number(String(o.valor ?? "").toString().replace(",", "."));
    const parcelas = Math.trunc(Number(o.parcelas ?? 0)) || 0;
    if (!Number.isFinite(valor) || valor <= 0) {
      return { ok: false, error: "Cada opção precisa de um valor maior que zero." };
    }
    if (parcelas < 0 || parcelas > 120) {
      return { ok: false, error: "Número de parcelas inválido." };
    }
    opcoes.push({ valor: Math.round(valor * 100) / 100, parcelas });
  }

  const aVista = opcoes.find((o) => o.parcelas <= 1);
  const snapshot = aVista?.valor ?? opcoes[0].valor;

  const { error } = await supabase
    .from("orcamentos")
    .update({
      qtd_equipamentos: qtdEquipamentos,
      tss_opcoes: opcoes,
      total_unidades: null,
      valor_tss: 0,
      valor_total: snapshot,
      atualizado_por: usuario.id,
    })
    .eq("id", id);
  if (error) return { ok: false, error: mensagemErroBanco(error) };

  await registrarHistorico(supabase, {
    orcamento_id: id,
    entidade: "orcamentos",
    entidade_id: id,
    acao: "atualizar",
    campo: "tss_light",
    valor_antes: { valor_total: orc.valor_total },
    valor_depois: { qtd_equipamentos: qtdEquipamentos, opcoes },
    descricao: `TSS Light salvo — ${qtdEquipamentos} equipamento(s), ${opcoes.length} opção(ões)`,
    alterado_por: usuario.id,
  });

  revalidatePath(`/orcamentos/${id}`);
  revalidatePath("/orcamentos");
  return { ok: true, error: null, mensagem: "TSS Light salvo." };
}

// ---------------------------------------------------------------------------
// Individualização de gás — qtd de apartamentos + medidor + gerenciamento.
// As 4 opções de investimento são calculadas pela tabela de preços (como a
// individualização de água) e congeladas em orcamentos.tss_opcoes.
// ---------------------------------------------------------------------------
export async function salvarIndividualizacaoGas(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const id = texto(formData, "id");
  if (!id) return { ok: false, error: "Registro inválido." };

  const { data: orc } = await supabase
    .from("orcamentos")
    .select("id, tipo_proposta, data_orcamento, valor_total")
    .eq("id", id)
    .single();
  if (!orc) return { ok: false, error: "Orçamento não encontrado." };
  if (orc.tipo_proposta !== "individualizacao_gas") {
    return { ok: false, error: "Este orçamento não é de individualização de gás." };
  }

  const qtdApartamentos = Math.trunc(numeroDecimal(formData, "qtd_apartamentos"));
  const pontosPorApartamento =
    Math.trunc(numeroDecimal(formData, "pontos_por_apartamento")) || 1;
  const valorGerenciamento = numeroDecimal(formData, "valor_gerenciamento");

  if (qtdApartamentos <= 0) {
    return { ok: false, error: "Informe a quantidade de apartamentos." };
  }
  if (pontosPorApartamento <= 0) {
    return { ok: false, error: "Pontos por apartamento inválido." };
  }

  const medidorGasRaw = texto(formData, "medidor_gas");
  const medidor_gas =
    medidorGasRaw === "gas_2_5" ? "gas_2_5" : "gas_1_6";

  // opções de investimento = as 4 formas próprias, com o preço vigente do
  // medidor de gás (por forma) × pontos por apartamento. Congela em tss_opcoes.
  const [{ data: itemGas }, { data: formasGas }] = await Promise.all([
    supabase
      .from("itens_precificaveis")
      .select("id")
      .eq("slug", medidor_gas)
      .maybeSingle(),
    supabase
      .from("formas_pagamento")
      .select("id, num_parcelas, ordem")
      .eq("ativo", true)
      .is("usa_preco_de_forma_id", null)
      .order("ordem"),
  ]);
  if (!itemGas) {
    return { ok: false, error: "Item do medidor de gás não encontrado." };
  }
  const formas = formasGas ?? [];
  const vigGas = await precosVigentesPorForma(
    supabase,
    formas.map((f) => f.id),
    [itemGas.id],
    orc.data_orcamento,
  );
  const opcoes = formas.map((f) => {
    const unit = vigGas.get(f.id)?.get(itemGas.id)?.valor ?? 0;
    return {
      valor: Math.round(unit * pontosPorApartamento * 100) / 100,
      parcelas: f.num_parcelas,
    };
  });
  if (opcoes.every((o) => o.valor <= 0)) {
    return {
      ok: false,
      error:
        "Sem preço vigente para este medidor de gás na tabela. Cadastre os preços primeiro.",
    };
  }

  const totalMedidores = qtdApartamentos * pontosPorApartamento;
  const aVista = opcoes.find((o) => o.parcelas <= 1);
  const snapshot = aVista?.valor ?? opcoes[0]?.valor ?? 0;

  const { error: gmErr } = await supabase
    .from("gerenciamento_mensal")
    .update({
      valor_por_hidrometro: valorGerenciamento,
      qtd_apartamentos: qtdApartamentos,
      pontos_por_apartamento: pontosPorApartamento,
      qtd_hidrometros: totalMedidores,
      valor_total_mensal:
        Math.round(totalMedidores * valorGerenciamento * 100) / 100,
    })
    .eq("orcamento_id", id);
  if (gmErr) return { ok: false, error: mensagemErroBanco(gmErr) };

  const { error } = await supabase
    .from("orcamentos")
    .update({
      qtd_equipamentos: totalMedidores,
      tss_opcoes: opcoes,
      medidor_gas,
      total_unidades: qtdApartamentos,
      valor_tss: 0,
      valor_total: snapshot,
      atualizado_por: usuario.id,
    })
    .eq("id", id);
  if (error) return { ok: false, error: mensagemErroBanco(error) };

  await registrarHistorico(supabase, {
    orcamento_id: id,
    entidade: "orcamentos",
    entidade_id: id,
    acao: "atualizar",
    campo: "individualizacao_gas",
    valor_antes: { valor_total: orc.valor_total },
    valor_depois: {
      qtd_apartamentos: qtdApartamentos,
      pontos_por_apartamento: pontosPorApartamento,
      valor_gerenciamento: valorGerenciamento,
      opcoes,
    },
    descricao: `Individualização de gás salva — ${totalMedidores} medidor(es), ${opcoes.length} opção(ões)`,
    alterado_por: usuario.id,
  });

  revalidatePath(`/orcamentos/${id}`);
  revalidatePath("/orcamentos");
  return { ok: true, error: null, mensagem: "Individualização de gás salva." };
}

// ---------------------------------------------------------------------------
// Recongelar preços pela tabela atual
// ---------------------------------------------------------------------------
export async function atualizarPrecosPelaTabela(formData: FormData): Promise<void> {
  const usuario = await requireUsuario();
  const supabase = await createClient();
  const id = texto(formData, "id");
  if (!id) return;

  await supabase
    .from("orcamento_valores_congelados")
    .delete()
    .eq("orcamento_id", id);

  await registrarHistorico(supabase, {
    orcamento_id: id,
    entidade: "orcamento_valores_congelados",
    entidade_id: id,
    acao: "atualizar",
    descricao:
      "Congelamento de preços limpo (recongelar pela tabela vigente no próximo salvamento)",
    alterado_por: usuario.id,
  });

  revalidatePath(`/orcamentos/${id}`);
  redirect(`/orcamentos/${id}?recongelar=1`);
}

// ---------------------------------------------------------------------------
// Excluir
// ---------------------------------------------------------------------------
export async function excluirOrcamento(formData: FormData): Promise<void> {
  await requireUsuario();
  const supabase = await createClient();
  const id = texto(formData, "id");
  if (!id) return;

  const { error } = await supabase.from("orcamentos").delete().eq("id", id);
  if (error) {
    redirect(`/orcamentos/${id}?erro=${encodeURIComponent(mensagemErroBanco(error))}`);
  }
  revalidatePath("/orcamentos");
  redirect("/orcamentos");
}
