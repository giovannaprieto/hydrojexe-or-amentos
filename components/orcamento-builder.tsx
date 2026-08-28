"use client";

import { useActionState, useMemo, useState } from "react";

import { salvarOrcamento } from "@/app/(app)/orcamentos/actions";
import { IconCheck, IconClose, IconPlus, IconTrash } from "@/components/icons";
import { FormError, FormSuccess, SubmitButton } from "@/components/ui";
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
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="id" value={orcamentoId} />
      <input type="hidden" name="payload" value={payload} />

      {/* Resumo da composição ------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-brand-200 bg-brand-50/70 px-4 py-3 text-sm text-navy-800">
        <span>
          Total de unidades:{" "}
          <strong className="tabular-nums">{base?.totalUnidades ?? 0}</strong>
        </span>
        <span>
          {incluirTss ? (
            <>
              Rateio de TSS por unidade (à vista):{" "}
              <strong className="tabular-nums">
                {formatBRL(base?.tssPorUnidade ?? 0)}
              </strong>
            </>
          ) : (
            "Sem TSS"
          )}
        </span>
        <span className="text-ink-500">
          O PDF traz {formas.map((f) => f.nome).join(", ")}
        </span>
      </div>

      {/* Tipos de apartamento ------------------------------------------------- */}
      {tipos.map((t, i) => (
        <div key={i} className="hj-card overflow-hidden">
          <div className="flex flex-wrap items-end gap-4 border-b border-ink-200 bg-ink-50/60 px-5 py-4">
            <label className="flex min-w-56 flex-1 flex-col gap-1.5">
              <span className="hj-field-label">Tipo de apartamento</span>
              <input
                className="hj-control"
                value={t.nome}
                onChange={(e) => setTipo(i, { nome: e.target.value })}
                placeholder="Ex.: Apartamento padrão"
              />
            </label>
            <label className="flex w-28 flex-col gap-1.5">
              <span className="hj-field-label">Unidades</span>
              <input
                type="number"
                min="0"
                className="hj-control text-right tabular-nums"
                value={t.unidades}
                onChange={(e) => setTipo(i, { unidades: e.target.value })}
              />
            </label>
            {tipos.length > 1 ? (
              <button
                type="button"
                onClick={() => rmTipo(i)}
                className="hj-btn hj-btn-danger hj-btn-sm mb-0.5"
              >
                <IconTrash />
                Remover tipo
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 px-5 py-4">
            {t.itens.length > 0 ? (
              <div className="hidden gap-2 px-1 sm:flex">
                <span className="hj-label flex-1">Item</span>
                <span className="hj-label w-20 text-center">Qtd.</span>
                <span className="hj-label w-28 text-right">Preço unit.</span>
                <span className="w-8" />
              </div>
            ) : null}

            {t.itens.map((ci, j) => (
              <div key={j} className="flex flex-wrap items-center gap-2">
                <select
                  className="hj-control min-w-52 flex-1"
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
                  className="hj-control w-20 text-right tabular-nums"
                  value={ci.quantidade}
                  onChange={(e) =>
                    setLinha(i, j, { quantidade: e.target.value })
                  }
                />
                <span className="w-28 text-right text-sm font-medium tabular-nums text-ink-600">
                  {ci.item_id ? formatBRL(precoBase[ci.item_id] ?? 0) : "—"}
                </span>
                <button
                  type="button"
                  onClick={() => rmLinha(i, j)}
                  aria-label="Remover item"
                  className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <IconClose className="size-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addLinha(i)}
              className="hj-btn hj-btn-ghost hj-btn-sm w-fit"
            >
              <IconPlus />
              Adicionar item
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink-200 bg-ink-50/60 px-5 py-3">
            <span className="hj-label">Valor por apartamento</span>
            {formas.map((f) => {
              const r = resultadoPorForma.get(f.id)?.tipos[i];
              return (
                <span key={f.id} className="text-sm text-ink-600">
                  {f.nome}{" "}
                  <strong className="tabular-nums text-navy-900">
                    {formatBRL(r?.valorPorApartamento ?? 0)}
                  </strong>
                </span>
              );
            })}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addTipo}
        className="hj-btn hj-btn-secondary w-fit"
      >
        <IconPlus />
        Adicionar tipo de apartamento
      </button>

      {/* Gerenciamento + totais ----------------------------------------------- */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="hj-card hj-card-pad flex flex-col gap-3">
          <p className="hj-card-title">Gerenciamento mensal</p>
          <p className="text-sm text-ink-600">
            {formatBRL(valorPorHidrometro)} por hidrômetro · contagem
            automática:{" "}
            <strong className="text-navy-900">
              {base?.qtdHidrometrosAuto ?? 0}
            </strong>
          </p>
          <label className="flex flex-wrap items-center gap-2 text-sm text-ink-700">
            <span>Sobrescrever qtd. hidrômetros:</span>
            <input
              type="number"
              min="0"
              className="hj-control w-24 text-right tabular-nums"
              placeholder="auto"
              value={override}
              onChange={(e) => setOverride(e.target.value)}
            />
          </label>
          <p className="mt-auto text-sm text-ink-600">
            Total mensal:{" "}
            <strong className="tabular-nums text-navy-900">
              {formatBRL(base?.valorTotalMensal ?? 0)}
            </strong>{" "}
            <span className="text-ink-400">
              ({base?.qtdHidrometros ?? 0} hidrômetro(s))
            </span>
          </p>
        </div>

        <div className="hj-card hj-card-pad flex flex-col gap-3 bg-navy-900">
          <p className="text-xs font-semibold tracking-wide text-brand-200 uppercase">
            Total do orçamento por forma
          </p>
          <dl className="flex flex-col gap-1.5">
            {formas.map((f) => (
              <div
                key={f.id}
                className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-1.5 last:border-0"
              >
                <dt className="text-sm text-navy-200">{f.nome}</dt>
                <dd className="font-semibold tabular-nums text-white">
                  {formatBRL(resultadoPorForma.get(f.id)?.valorTotal ?? 0)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {Object.values(precoOrigem).includes("sem") ? (
        <p className="hj-alert hj-alert-warn">
          Sem preço na tabela vigente (contam como R$ 0):{" "}
          {itens
            .filter((i) => precoOrigem[i.id] === "sem")
            .map((i) => nomeItem.get(i.id))
            .join(", ")}
          .
        </p>
      ) : null}

      {state.ok ? <FormSuccess message={state.mensagem ?? "Salvo."} /> : null}
      <FormError message={state.error} />

      <div className="flex justify-end">
        <SubmitButton pendingLabel="Salvando…" icone={<IconCheck />}>
          Salvar orçamento
        </SubmitButton>
      </div>
    </form>
  );
}
