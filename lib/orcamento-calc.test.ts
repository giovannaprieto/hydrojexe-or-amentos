import { describe, expect, it } from "vitest";

import {
  calcGestaoMensal,
  calcIndividualizacaoGasOpcoes,
  calcTssLightOpcoes,
  calcularOrcamento,
  round2,
  type CalcInput,
} from "@/lib/orcamento-calc";

describe("round2", () => {
  it("2 casas com correção de EPSILON", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(2.675)).toBe(2.68);
  });
});

function baseInput(over: Partial<CalcInput> = {}): CalcInput {
  return {
    tipos: [
      {
        nome: "2 quartos",
        unidades: 10,
        itens: [
          { item_id: "medidor", quantidade: 1 },
          { item_id: "instalacao", quantidade: 2 },
        ],
      },
    ],
    precoUnit: { medidor: 100, instalacao: 25, tss: 999 },
    incluirTss: false,
    tssValor: 0,
    itensPonto: ["medidor"],
    itensTss: ["tss"],
    valorPorHidrometro: 0,
    qtdHidrometrosOverride: null,
    ...over,
  };
}

describe("calcularOrcamento — composição", () => {
  it("valor por apartamento = Σ(qtd × preço), total = unidades × valor", () => {
    const r = calcularOrcamento(baseInput());
    // 1×100 + 2×25 = 150
    expect(r.tipos[0].valorPorApartamento).toBe(150);
    expect(r.tipos[0].subtotal).toBe(1500);
    expect(r.valorTotal).toBe(1500);
    expect(r.totalUnidades).toBe(10);
  });

  it("item marcado TSS não entra na composição do apartamento", () => {
    const r = calcularOrcamento(
      baseInput({
        tipos: [
          {
            nome: "com tss na lista",
            unidades: 5,
            itens: [
              { item_id: "medidor", quantidade: 1 },
              { item_id: "tss", quantidade: 1 },
            ],
          },
        ],
      }),
    );
    expect(r.tipos[0].valorPorApartamento).toBe(100);
  });

  it("preço ausente é tratado como 0", () => {
    const r = calcularOrcamento(
      baseInput({
        tipos: [
          {
            nome: "x",
            unidades: 1,
            itens: [{ item_id: "desconhecido", quantidade: 3 }],
          },
        ],
      }),
    );
    expect(r.tipos[0].valorPorApartamento).toBe(0);
  });
});

describe("calcularOrcamento — rateio de TSS", () => {
  it("incluirTss rateia tssValor por todas as unidades", () => {
    const r = calcularOrcamento(
      baseInput({
        incluirTss: true,
        tssValor: 1000,
        tipos: [
          { nome: "A", unidades: 6, itens: [{ item_id: "medidor", quantidade: 1 }] },
          { nome: "B", unidades: 4, itens: [{ item_id: "medidor", quantidade: 1 }] },
        ],
      }),
    );
    // 1000 / 10 = 100 por unidade, somado a cada valor por apto (100)
    expect(r.tssPorUnidade).toBeCloseTo(100, 6);
    expect(r.tipos[0].valorPorApartamento).toBe(200);
    expect(r.tipos[1].valorPorApartamento).toBe(200);
    expect(r.valorTotal).toBe(2000);
  });

  it("sem incluirTss não há rateio mesmo com tssValor", () => {
    const r = calcularOrcamento(baseInput({ incluirTss: false, tssValor: 5000 }));
    expect(r.tssPorUnidade).toBe(0);
    expect(r.tipos[0].valorPorApartamento).toBe(150);
  });

  it("total de unidades 0 não divide por zero", () => {
    const r = calcularOrcamento(
      baseInput({
        incluirTss: true,
        tssValor: 1000,
        tipos: [{ nome: "vazio", unidades: 0, itens: [] }],
      }),
    );
    expect(r.tssPorUnidade).toBe(0);
    expect(r.valorTotal).toBe(0);
  });
});

describe("calcularOrcamento — hidrômetros e mensal", () => {
  it("conta hidrômetros pelos itens-ponto × unidades", () => {
    const r = calcularOrcamento(
      baseInput({
        tipos: [
          { nome: "A", unidades: 10, itens: [{ item_id: "medidor", quantidade: 1 }] },
          { nome: "B", unidades: 5, itens: [{ item_id: "medidor", quantidade: 2 }] },
        ],
        valorPorHidrometro: 12,
      }),
    );
    expect(r.qtdHidrometrosAuto).toBe(10 * 1 + 5 * 2);
    expect(r.qtdHidrometros).toBe(20);
    expect(r.valorTotalMensal).toBe(240);
  });

  it("override substitui a contagem automática", () => {
    const r = calcularOrcamento(
      baseInput({ qtdHidrometrosOverride: 99, valorPorHidrometro: 10 }),
    );
    expect(r.qtdHidrometros).toBe(99);
    expect(r.valorTotalMensal).toBe(990);
  });

  it("override null cai na contagem automática", () => {
    const r = calcularOrcamento(
      baseInput({ qtdHidrometrosOverride: null, valorPorHidrometro: 10 }),
    );
    expect(r.qtdHidrometros).toBe(r.qtdHidrometrosAuto);
  });
});

describe("calcGestaoMensal", () => {
  it("total = qtd apartamentos × pontos × valor por ponto", () => {
    expect(
      calcGestaoMensal({
        qtdApartamentos: 20,
        pontosPorApartamento: 2,
        valorPorApartamento: 7.5,
      }),
    ).toEqual({ totalPontos: 40, valorTotalMensal: 300 });
  });

  it("pontos por apartamento 0 conta como 1", () => {
    expect(
      calcGestaoMensal({
        qtdApartamentos: 10,
        pontosPorApartamento: 0,
        valorPorApartamento: 5,
      }),
    ).toEqual({ totalPontos: 10, valorTotalMensal: 50 });
  });
});

describe("calcTssLightOpcoes", () => {
  it("uma opção por forma, valor = preço unitário do TSS (sem multiplicar)", () => {
    expect(
      calcTssLightOpcoes([
        { num_parcelas: 1, precoUnit: 1000 },
        { num_parcelas: 12, precoUnit: 1200 },
      ]),
    ).toEqual([
      { valor: 1000, parcelas: 1 },
      { valor: 1200, parcelas: 12 },
    ]);
  });
});

describe("calcIndividualizacaoGasOpcoes", () => {
  it("valor = preço unitário × pontos por apartamento", () => {
    expect(
      calcIndividualizacaoGasOpcoes(
        [
          { num_parcelas: 1, precoUnit: 500 },
          { num_parcelas: 6, precoUnit: 550 },
        ],
        2,
      ),
    ).toEqual([
      { valor: 1000, parcelas: 1 },
      { valor: 1100, parcelas: 6 },
    ]);
  });

  it("pontos 0 conta como 1", () => {
    expect(
      calcIndividualizacaoGasOpcoes([{ num_parcelas: 1, precoUnit: 500 }], 0),
    ).toEqual([{ valor: 500, parcelas: 1 }]);
  });
});
