"use client";

import { useActionState, useMemo, useState } from "react";

import { salvarOrcamento } from "@/app/(app)/orcamentos/actions";
import { FormError, SubmitButton } from "@/components/ui";
import { formatBRL } from "@/lib/format";
import { emptyFormState } from "@/lib/forms";
import { calcularOrcamento, type CalcResultado } from "@/lib/orcamento-calc";

type ItemCat = {
  id: string;
  nome: string;
  unidade: string;
  is_tss: boolean;
};

type Forma = { id: string; nome: string };
type LinhaItem = { item_id: string; quantidade: string };
type Tipo = { nome: string; unidades: string; itens: LinhaItem[] };

const inputBase =
  "rounded-md border border-black/15 bg-transparent px-2 py-1 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50";

export function OrcamentoBuilder({
  orcamentoId,
  incluirTss,
  itens,
  formas,
  formaBaseId,
  precoUnitPorForma,
  precoOrigem,
  tssItemId,
  tiposIniciais,
  valorPorHidrometro,
  qtdHidrometrosOverrideInicial,
}: {
  orcamentoId: string;
  incluirTss: boolean;
  itens: ItemCat[];
  formas: Forma[];
  formaBaseId: string;
  precoUnitPorForma: Record<string, Record<string, number>>;
  precoOrigem: Record<string, "congelado" | "atual" | "sem">;
  tssItemId: string | null;
  tiposIniciais: { nome: string; unidades: number; itens: { item_id: string; quantidade: number }[] }[];
  valorPorHidrometro: number;
  qtdHidrometrosOverrideInicial: number | null;
}) {
  const [state, formAction] = useActionState(salvarOrcamento, emptyFormState);

  const [tipos, setTipos] = useState<Tipo[]>(
    tiposIniciais.length > 0
      ? tiposIniciais.map((t) => ({
          nome: t.nome,
          unidades: String(t.unidades),
          itens: t.itens.map((ci) => ({
            item_id: ci.item_id,
            quantidade: String(ci.quantidade),
          })),
        }))
      : [{ nome: "", unidades: "", itens: [] }],
  );
  const [override, setOverride] = useState<string>(
    qtdHidrometrosOverrideInicial != null
      ? String(qtdHidrometrosOverrideInicial)
      : "",
  );

  const itensComposicao = itens.filter((i) => !i.is_tss);
  const itensPonto = itens.filter((i) => i.unidade === "ponto").map((i) => i.id);
  const itensTss = itens.filter((i) => i.is_tss).map((i) => i.id);
  const nomeItem = new Map(itens.map((i) => [i.id, i.nome]));
  const precoBase = precoUnitPorForma[formaBaseId] ?? {};

  const tiposCalc = useMemo(
    () =>
      tipos.map((t) => ({
        nome: t.nome,
        unidades: Number(t.unidades) || 0,
        itens: t.itens.map((ci) => ({
          item_id: ci.item_id,
          quantidade: Number(ci.quantidade) || 0,
        })),
      })),
    [tipos],
  );

  const resultadoPorForma = useMemo(() => {
    const m = new Map<string, CalcResultado>();
    for (const f of formas) {
      const precoUnit = precoUnitPorForma[f.id] ?? {};
      m.set(
        f.id,
        calcularOrcamento({
          tipos: tiposCalc,
          precoUnit,
          incluirTss,
          tssValor:
            incluirTss && tssItemId ? (precoUnit[tssItemId] ?? 0) : 0,
          itensPonto,
          itensTss,
          valorPorHidrometro,
          qtdHidrometrosOverride: override === "" ? null : Number(override),
        }),
      );
    }
    return m;
  }, [
    tiposCalc,
    override,
    formas,
    precoUnitPorForma,
    incluirTss,
    tssItemId,
    itensPonto,
    itensTss,
    valorPorHidrometro,
  ]);

  const base = resultadoPorForma.get(formaBaseId);

  const payload = JSON.stringify({
    tipos: tipos.map((t) => ({
      nome: t.nome.trim(),
      unidades: Number(t.unidades) || 0,
      itens: t.itens
        .filter((ci) => ci.item_id && Number(ci.quantidade) > 0)
        .map((ci) => ({
          item_id: ci.item_id,
          quantidade: Number(ci.quantidade),
        })),
    })),
    gerenciamento: {
      valor_por_hidrometro: valorPorHidrometro,
      qtd_hidrometros_override: override === "" ? null : Number(override),
    },
  });

  const setTipo = (i: number, patch: Partial<Tipo>) =>
    setTipos((ts) => ts.map((t, k) => (k === i ? { ...t, ...patch } : t)));
  const addTipo = () =>
    setTipos((ts) => [...ts, { nome: "", unidades: "", itens: [] }]);
  const rmTipo = (i: number) => setTipos((ts) => ts.filter((_, k) => k !== i));
  const addLinha = (i: number) =>
    setTipo(i, {
      itens: [...tipos[i].itens, { item_id: "", quantidade: "1" }],
    });
  const setLinha = (i: number, j: number, patch: Partial<LinhaItem>) =>
    setTipo(i, {
      itens: tipos[i].itens.map((ci, k) => (k === j ? { ...ci, ...patch } : ci)),
    });
  const rmLinha = (i: number, j: number) =>
    setTipo(i, { itens: tipos[i].itens.filter((_, k) => k !== j) });

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={orcamentoId} />
      <input type="hidden" name="payload" value={payload} />

      <p className="text-sm text-black/60 dark:text-white/60">
        Total de unidades: {base?.totalUnidades ?? 0}
        {incluirTss
          ? ` · rateio de TSS por unidade (à vista) ${formatBRL(base?.tssPorUnidade ?? 0)}`
          : " · sem TSS"}
        {" · o PDF traz "}
        {formas.map((f) => f.nome).join(", ")}
      </p>

      {tipos.map((t, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/10"
        >
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="font-medium">Tipo de apartamento</span>
              <input
                className={inputBase}
                value={t.nome}
                onChange={(e) => setTipo(i, { nome: e.target.value })}
                placeholder="Ex.: Apartamento padrão"
              />
            </label>
            <label className="flex w-28 flex-col gap-1 text-sm">
              <span className="font-medium">Unidades</span>
              <input
                type="number"
                min="0"
                className={inputBase}
                value={t.unidades}
                onChange={(e) => setTipo(i, { unidades: e.target.value })}
              />
            </label>
            {tipos.length > 1 ? (
              <button
                type="button"
                onClick={() => rmTipo(i)}
                className="rounded-md border border-black/15 px-2 py-1 text-sm text-black/60 hover:bg-black/5 dark:border-white/20 dark:text-white/60 dark:hover:bg-white/10"
              >
                Remover tipo
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            {t.itens.map((ci, j) => (
              <div key={j} className="flex flex-wrap items-center gap-2">
                <select
                  className={`${inputBase} min-w-52 flex-1`}
                  value={ci.item_id}
                  onChange={(e) => setLinha(i, j, { item_id: e.target.value })}
                >
                  <option value="">Selecione o item…</option>
                  {itensComposicao.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.nome}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  className={`${inputBase} w-20`}
                  value={ci.quantidade}
                  onChange={(e) =>
                    setLinha(i, j, { quantidade: e.target.value })
                  }
                />
                <span className="w-28 text-right text-sm tabular-nums text-black/60 dark:text-white/60">
                  {ci.item_id ? formatBRL(precoBase[ci.item_id] ?? 0) : "—"}
                </span>
                <button
                  type="button"
                  onClick={() => rmLinha(i, j)}
                  className="text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  remover
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addLinha(i)}
              className="w-fit text-sm text-black/60 underline-offset-2 hover:underline dark:text-white/60"
            >
              + item
            </button>
          </div>

          <p className="text-sm">
            Valor por apartamento:{" "}
            {formas.map((f, k) => {
              const r = resultadoPorForma.get(f.id)?.tipos[i];
              return (
                <span key={f.id}>
                  {k > 0 ? " · " : ""}
                  {f.nome}{" "}
                  <strong className="tabular-nums">
                    {formatBRL(r?.valorPorApartamento ?? 0)}
                  </strong>
                </span>
              );
            })}
          </p>
        </div>
      ))}

      <button
        type="button"
        onClick={addTipo}
        className="w-fit rounded-md border border-black/15 px-3 py-2 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
      >
        + Adicionar tipo de apartamento
      </button>

      <div className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 text-sm dark:border-white/10">
        <p className="font-medium">Gerenciamento mensal</p>
        <p className="text-black/60 dark:text-white/60">
          {formatBRL(valorPorHidrometro)} por hidrômetro · contagem automática:{" "}
          <strong>{base?.qtdHidrometrosAuto ?? 0}</strong>
        </p>
        <label className="flex items-center gap-2">
          <span>Sobrescrever qtd. hidrômetros:</span>
          <input
            type="number"
            min="0"
            className={`${inputBase} w-24`}
            placeholder="auto"
            value={override}
            onChange={(e) => setOverride(e.target.value)}
          />
        </label>
        <p>
          Total mensal:{" "}
          <strong className="tabular-nums">
            {formatBRL(base?.valorTotalMensal ?? 0)}
          </strong>{" "}
          <span className="text-black/50 dark:text-white/50">
            ({base?.qtdHidrometros ?? 0} hidrômetro(s))
          </span>
        </p>
      </div>

      <div className="flex flex-col gap-1 rounded-lg border border-black/15 bg-black/[0.03] p-4 dark:border-white/15 dark:bg-white/[0.03]">
        <p className="text-sm font-medium">Total do orçamento por forma</p>
        {formas.map((f) => (
          <p key={f.id} className="text-sm tabular-nums">
            {f.nome}:{" "}
            <strong>
              {formatBRL(resultadoPorForma.get(f.id)?.valorTotal ?? 0)}
            </strong>
          </p>
        ))}
      </div>

      {Object.values(precoOrigem).includes("sem") ? (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Sem preço na tabela vigente (contam como R$ 0):{" "}
          {itens
            .filter((i) => precoOrigem[i.id] === "sem")
            .map((i) => nomeItem.get(i.id))
            .join(", ")}
          .
        </p>
      ) : null}

      {state.ok ? (
        <p className="text-sm text-green-700 dark:text-green-400">
          {state.mensagem ?? "Salvo."}
        </p>
      ) : null}
      <FormError message={state.error} />

      <SubmitButton pendingLabel="Salvando…">Salvar orçamento</SubmitButton>
    </form>
  );
}
