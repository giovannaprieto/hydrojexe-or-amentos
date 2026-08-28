"use client";

import { useMemo, useState } from "react";

import { IconPlus, IconRefresh, IconTrash } from "@/components/icons";
import { Card, TableWrap } from "@/components/ui-layout";
import { formatBRL } from "@/lib/format";
import {
  calcGestaoMensal,
  calcIndividualizacaoGasOpcoes,
  calcTssLightOpcoes,
  calcularOrcamento,
} from "@/lib/orcamento-calc";
import { TIPOS_PROPOSTA } from "@/lib/orcamento-tipos";

type Item = {
  id: string;
  nome: string;
  slug: string;
  unidade: string;
  is_tss: boolean;
  ordem: number;
};
type Forma = { id: string; nome: string; slug: string; num_parcelas: number };

type LinhaComposicao = { item_id: string; qtd: string };
type TipoApto = { nome: string; unidades: string; itens: LinhaComposicao[] };

const nZero = (s: string) => Number(s.replace(",", ".")) || 0;
const nInt = (s: string) => Math.trunc(nZero(s));

export function CalculadoraForm({
  catalogo,
  formas,
  precoUnitPorForma,
}: {
  catalogo: Item[];
  formas: Forma[];
  precoUnitPorForma: Record<string, Record<string, number>>;
}) {
  const [tipo, setTipo] = useState<string>("completa");

  // --- individualização de água (completa) ---------------------------------
  const itensPonto = catalogo.filter((i) => i.unidade === "ponto");
  const itensNaoTss = catalogo.filter((i) => !i.is_tss);
  const tssItem = catalogo.find((i) => i.is_tss) ?? null;

  const [tipos, setTipos] = useState<TipoApto[]>([
    {
      nome: "Padrão",
      unidades: "",
      itens: [{ item_id: itensPonto[0]?.id ?? "", qtd: "1" }],
    },
  ]);
  const [incluirTss, setIncluirTss] = useState(true);
  const [leitura, setLeitura] = useState("");

  // --- tipos "simples" ----------------------------------------------------
  const [qtdEquip, setQtdEquip] = useState("");
  const [qtdApt, setQtdApt] = useState("");
  const [pontos, setPontos] = useState("1");
  const [medidor, setMedidor] = useState("gas_1_6");
  const [valorMensal, setValorMensal] = useState("");

  const setLinha = (ti: number, li: number, patch: Partial<LinhaComposicao>) =>
    setTipos((ts) =>
      ts.map((t, i) =>
        i !== ti
          ? t
          : {
              ...t,
              itens: t.itens.map((l, j) => (j === li ? { ...l, ...patch } : l)),
            },
      ),
    );

  const resetar = () => {
    setTipos([
      {
        nome: "Padrão",
        unidades: "",
        itens: [{ item_id: itensPonto[0]?.id ?? "", qtd: "1" }],
      },
    ]);
    setIncluirTss(true);
    setLeitura("");
    setQtdEquip("");
    setQtdApt("");
    setPontos("1");
    setMedidor("gas_1_6");
    setValorMensal("");
  };

  // ----------------------------------------------------------------------
  const resultado = useMemo(() => {
    if (tipo === "completa") {
      const tiposCalc = tipos.map((t) => ({
        nome: t.nome || "Tipo",
        unidades: nInt(t.unidades),
        itens: t.itens
          .filter((l) => l.item_id && nZero(l.qtd) > 0)
          .map((l) => ({ item_id: l.item_id, quantidade: nZero(l.qtd) })),
      }));
      return formas.map((f) => {
        const precoUnit = precoUnitPorForma[f.id] ?? {};
        const r = calcularOrcamento({
          tipos: tiposCalc,
          precoUnit,
          incluirTss,
          tssValor: incluirTss && tssItem ? (precoUnit[tssItem.id] ?? 0) : 0,
          itensPonto: itensPonto.map((i) => i.id),
          itensTss: tssItem ? [tssItem.id] : [],
          valorPorHidrometro: nZero(leitura),
        });
        return {
          forma: f,
          valorTotal: r.valorTotal,
          leituraMensal: r.valorTotalMensal,
          tssPorApto: r.tssPorUnidade,
          porTipo: r.tipos,
        };
      });
    }

    if (tipo === "tss_light") {
      const opc = calcTssLightOpcoes(
        formas.map((f) => {
          const it = catalogo.find((i) => i.slug === "tss");
          return {
            num_parcelas: f.num_parcelas,
            precoUnit: it ? (precoUnitPorForma[f.id]?.[it.id] ?? 0) : 0,
          };
        }),
      );
      return formas.map((f, i) => ({ forma: f, valor: opc[i]?.valor ?? 0 }));
    }

    if (tipo === "individualizacao_gas") {
      const it = catalogo.find((i) => i.slug === medidor);
      const opc = calcIndividualizacaoGasOpcoes(
        formas.map((f) => ({
          num_parcelas: f.num_parcelas,
          precoUnit: it ? (precoUnitPorForma[f.id]?.[it.id] ?? 0) : 0,
        })),
        nInt(pontos),
      );
      const totalMedidores = nInt(qtdApt) * (nInt(pontos) || 1);
      const gm = calcGestaoMensal({
        qtdApartamentos: nInt(qtdApt),
        pontosPorApartamento: nInt(pontos),
        valorPorApartamento: nZero(valorMensal),
      });
      return {
        opcoes: formas.map((f, i) => ({ forma: f, valor: opc[i]?.valor ?? 0 })),
        totalMedidores,
        gerenciamentoMensal: gm.valorTotalMensal,
      };
    }

    // gestão mensal água/gás
    const gm = calcGestaoMensal({
      qtdApartamentos: nInt(qtdApt),
      pontosPorApartamento: nInt(pontos),
      valorPorApartamento: nZero(valorMensal),
    });
    return gm;
  }, [
    tipo,
    tipos,
    incluirTss,
    leitura,
    qtdApt,
    pontos,
    medidor,
    valorMensal,
    formas,
    catalogo,
    precoUnitPorForma,
    itensPonto,
    tssItem,
  ]);

  return (
    <div className="flex flex-col gap-5">
      <Card titulo="Simulação">
        <div className="flex flex-col gap-5">
          <label className="flex max-w-sm flex-col gap-1">
            <span className="hj-field-label">Tipo de serviço</span>
            <select
              className="hj-control"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              {TIPOS_PROPOSTA.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.rotulo}
                </option>
              ))}
            </select>
          </label>

          {tipo === "completa" ? (
            <div className="flex flex-col gap-4">
              {tipos.map((t, ti) => (
                <div
                  key={ti}
                  className="rounded-xl border border-ink-200 bg-ink-50/50 p-4"
                >
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="hj-hint">Nome do tipo</span>
                      <input
                        className="hj-control w-40"
                        value={t.nome}
                        onChange={(e) =>
                          setTipos((ts) =>
                            ts.map((x, i) =>
                              i === ti ? { ...x, nome: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="hj-hint">Unidades</span>
                      <input
                        type="number"
                        min="0"
                        className="hj-control w-28"
                        value={t.unidades}
                        onChange={(e) =>
                          setTipos((ts) =>
                            ts.map((x, i) =>
                              i === ti
                                ? { ...x, unidades: e.target.value }
                                : x,
                            ),
                          )
                        }
                      />
                    </label>
                    {tipos.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setTipos((ts) => ts.filter((_, i) => i !== ti))
                        }
                        className="hj-btn hj-btn-ghost hj-btn-sm"
                      >
                        <IconTrash className="size-4" />
                        Remover
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-col gap-2">
                    {t.itens.map((l, li) => (
                      <div key={li} className="flex flex-wrap items-end gap-2">
                        <select
                          className="hj-control w-56"
                          value={l.item_id}
                          onChange={(e) =>
                            setLinha(ti, li, { item_id: e.target.value })
                          }
                        >
                          {itensNaoTss.map((it) => (
                            <option key={it.id} value={it.id}>
                              {it.nome}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="hj-control w-24"
                          value={l.qtd}
                          onChange={(e) =>
                            setLinha(ti, li, { qtd: e.target.value })
                          }
                        />
                        {t.itens.length > 1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setTipos((ts) =>
                                ts.map((x, i) =>
                                  i === ti
                                    ? {
                                        ...x,
                                        itens: x.itens.filter(
                                          (_, j) => j !== li,
                                        ),
                                      }
                                    : x,
                                ),
                              )
                            }
                            aria-label="Remover item"
                            className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <IconTrash className="size-4" />
                          </button>
                        ) : null}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setTipos((ts) =>
                          ts.map((x, i) =>
                            i === ti
                              ? {
                                  ...x,
                                  itens: [
                                    ...x.itens,
                                    { item_id: itensNaoTss[0]?.id ?? "", qtd: "1" },
                                  ],
                                }
                              : x,
                          ),
                        )
                      }
                      className="hj-btn hj-btn-secondary hj-btn-sm w-fit"
                    >
                      <IconPlus />
                      Item
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setTipos((ts) => [
                      ...ts,
                      {
                        nome: "",
                        unidades: "",
                        itens: [
                          { item_id: itensPonto[0]?.id ?? "", qtd: "1" },
                        ],
                      },
                    ])
                  }
                  className="hj-btn hj-btn-secondary hj-btn-sm"
                >
                  <IconPlus />
                  Tipo de apartamento
                </button>
                <label className="inline-flex items-center gap-2 text-sm text-navy-800">
                  <input
                    type="checkbox"
                    className="size-4 accent-brand-500"
                    checked={incluirTss}
                    onChange={(e) => setIncluirTss(e.target.checked)}
                  />
                  Incluir TSS (rateio por unidade)
                </label>
                <label className="flex flex-col gap-1">
                  <span className="hj-hint">Leitura (R$/hidrômetro/mês)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="hj-control w-40"
                    value={leitura}
                    onChange={(e) => setLeitura(e.target.value)}
                  />
                </label>
              </div>
            </div>
          ) : tipo === "tss_light" ? (
            <label className="flex max-w-xs flex-col gap-1">
              <span className="hj-hint">Qtd. de equipamentos</span>
              <input
                type="number"
                min="1"
                className="hj-control"
                value={qtdEquip}
                onChange={(e) => setQtdEquip(e.target.value)}
              />
            </label>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="hj-hint">Qtd. de apartamentos</span>
                <input
                  type="number"
                  min="1"
                  className="hj-control"
                  value={qtdApt}
                  onChange={(e) => setQtdApt(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="hj-hint">
                  {tipo === "individualizacao_gas"
                    ? "Medidores por apto"
                    : "Pontos por apto"}
                </span>
                <input
                  type="number"
                  min="1"
                  className="hj-control"
                  value={pontos}
                  onChange={(e) => setPontos(e.target.value)}
                />
              </label>
              {tipo === "individualizacao_gas" ? (
                <label className="flex flex-col gap-1">
                  <span className="hj-hint">Medidor de gás</span>
                  <select
                    className="hj-control"
                    value={medidor}
                    onChange={(e) => setMedidor(e.target.value)}
                  >
                    <option value="gas_1_6">Gás 1.6</option>
                    <option value="gas_2_5">Gás 2.5</option>
                  </select>
                </label>
              ) : null}
              <label className="flex flex-col gap-1">
                <span className="hj-hint">
                  {tipo === "individualizacao_gas"
                    ? "Gerenciamento mensal (R$/gasômetro)"
                    : "Valor mensal (R$/ponto)"}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="hj-control"
                  value={valorMensal}
                  onChange={(e) => setValorMensal(e.target.value)}
                />
              </label>
            </div>
          )}
        </div>
      </Card>

      <ResultadoCalc tipo={tipo} resultado={resultado} qtdEquip={nInt(qtdEquip)} />

      <div>
        <button
          type="button"
          onClick={resetar}
          className="hj-btn hj-btn-secondary"
        >
          <IconRefresh />
          Nova simulação
        </button>
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function ResultadoCalc({
  tipo,
  resultado,
  qtdEquip,
}: {
  tipo: string;
  resultado: any;
  qtdEquip: number;
}) {
  if (tipo === "completa") {
    const linhas = resultado as {
      forma: Forma;
      valorTotal: number;
      leituraMensal: number;
      tssPorApto: number;
    }[];
    const aVista = linhas[0];
    return (
      <Card titulo="Estimativa" plano>
        <div className="hj-card-pad flex flex-col gap-4">
          <div className="flex items-baseline gap-3 rounded-lg bg-navy-900 px-5 py-4">
            <span className="text-xs font-semibold tracking-wide text-brand-200 uppercase">
              Estimativa (total à vista)
            </span>
            <span className="text-2xl font-semibold text-white tabular-nums">
              {formatBRL(aVista?.valorTotal ?? 0)}
            </span>
          </div>
          <TableWrap>
            <thead>
              <tr>
                <th>Forma de pagamento</th>
                <th className="text-right">TSS rateado / apto</th>
                <th className="text-right">Total do orçamento</th>
                <th className="text-right">Leitura mensal</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.forma.id}>
                  <td className="font-medium text-navy-900">{l.forma.nome}</td>
                  <td className="text-right tabular-nums text-ink-600">
                    {formatBRL(l.tssPorApto)}
                  </td>
                  <td className="text-right font-medium tabular-nums">
                    {formatBRL(l.valorTotal)}
                  </td>
                  <td className="text-right tabular-nums text-ink-600">
                    {formatBRL(l.leituraMensal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      </Card>
    );
  }

  if (tipo === "tss_light") {
    const linhas = resultado as { forma: Forma; valor: number }[];
    return (
      <Card titulo="Estimativa" plano>
        <div className="hj-card-pad">
          <TableWrap>
            <thead>
              <tr>
                <th>Forma de pagamento</th>
                <th className="text-right">Valor por equipamento</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.forma.id}>
                  <td className="font-medium text-navy-900">{l.forma.nome}</td>
                  <td className="text-right font-medium tabular-nums">
                    {formatBRL(l.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <p className="mt-3 text-xs text-ink-500">
            {qtdEquip || 1} equipamento(s) — o valor é por equipamento.
          </p>
        </div>
      </Card>
    );
  }

  if (tipo === "individualizacao_gas") {
    const r = resultado as {
      opcoes: { forma: Forma; valor: number }[];
      totalMedidores: number;
      gerenciamentoMensal: number;
    };
    return (
      <Card titulo="Estimativa" plano>
        <div className="hj-card-pad flex flex-col gap-3">
          <TableWrap>
            <thead>
              <tr>
                <th>Forma de pagamento</th>
                <th className="text-right">Valor por apartamento</th>
              </tr>
            </thead>
            <tbody>
              {r.opcoes.map((l) => (
                <tr key={l.forma.id}>
                  <td className="font-medium text-navy-900">{l.forma.nome}</td>
                  <td className="text-right font-medium tabular-nums">
                    {formatBRL(l.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <p className="text-xs text-ink-500">
            {r.totalMedidores} medidor(es) · gerenciamento mensal{" "}
            {formatBRL(r.gerenciamentoMensal)}
          </p>
        </div>
      </Card>
    );
  }

  // gestão mensal
  const gm = resultado as { totalPontos: number; valorTotalMensal: number };
  return (
    <Card titulo="Estimativa" plano>
      <div className="hj-card-pad flex items-baseline gap-3 rounded-lg bg-navy-900 px-5 py-4">
        <span className="text-xs font-semibold tracking-wide text-brand-200 uppercase">
          Total mensal ({gm.totalPontos} ponto(s))
        </span>
        <span className="text-2xl font-semibold text-white tabular-nums">
          {formatBRL(gm.valorTotalMensal)}
        </span>
      </div>
    </Card>
  );
}
