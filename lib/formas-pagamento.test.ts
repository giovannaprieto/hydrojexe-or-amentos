import { describe, expect, it } from "vitest";

import {
  FORMAS_PAGAMENTO_BASE,
  filtrarPorFormasVisiveis,
  parcelasOrigemPreco,
  parseFormasVisiveis,
  rotuloFormaBase,
} from "@/lib/formas-pagamento";

describe("rotuloFormaBase", () => {
  it("trata <= 1 como à vista", () => {
    expect(rotuloFormaBase(1)).toBe("À vista");
    expect(rotuloFormaBase(0)).toBe("À vista");
  });
  it("demais são Nx", () => {
    expect(rotuloFormaBase(6)).toBe("6x");
    expect(rotuloFormaBase(12)).toBe("12x");
  });
});

describe("parseFormasVisiveis", () => {
  it("vazio/ inválido = todas as 4 base", () => {
    expect(parseFormasVisiveis(null)).toEqual([...FORMAS_PAGAMENTO_BASE]);
    expect(parseFormasVisiveis([])).toEqual([...FORMAS_PAGAMENTO_BASE]);
    expect(parseFormasVisiveis("x")).toEqual([...FORMAS_PAGAMENTO_BASE]);
    expect(parseFormasVisiveis([99, 3])).toEqual([...FORMAS_PAGAMENTO_BASE]);
  });

  it("mantém só o subconjunto válido, sempre na ordem base", () => {
    expect(parseFormasVisiveis([12, 1])).toEqual([1, 12]);
    expect(parseFormasVisiveis(["6", "9"])).toEqual([6, 9]);
  });

  it("remove duplicatas e valores fora da base", () => {
    expect(parseFormasVisiveis([6, 6, 6, 7])).toEqual([6]);
  });
});

describe("parcelasOrigemPreco (parcelamento especial)", () => {
  it("sem especial: usa a própria coluna", () => {
    for (const n of [1, 6, 9, 12]) {
      expect(parcelasOrigemPreco(n, false)).toBe(n);
    }
  });

  it("com especial: 9x usa preço de 6x, 12x usa preço de 9x", () => {
    expect(parcelasOrigemPreco(9, true)).toBe(6);
    expect(parcelasOrigemPreco(12, true)).toBe(9);
  });

  it("com especial: à vista e 6x não mudam", () => {
    expect(parcelasOrigemPreco(1, true)).toBe(1);
    expect(parcelasOrigemPreco(6, true)).toBe(6);
  });

  it("com especial: 24x não é deslocado aqui (resolvido via formas extras)", () => {
    expect(parcelasOrigemPreco(24, true)).toBe(24);
  });
});

describe("filtrarPorFormasVisiveis", () => {
  const opcoes = [
    { parcelas: 1, valor: 100 },
    { parcelas: 6, valor: 110 },
    { parcelas: 9, valor: 120 },
    { parcelas: 12, valor: 130 },
  ];

  it("filtra pelas parcelas visíveis", () => {
    expect(filtrarPorFormasVisiveis(opcoes, [1, 12]).map((o) => o.parcelas)).toEqual(
      [1, 12],
    );
  });

  it("à vista casa qualquer parcela <= 1", () => {
    const comZero = [{ parcelas: 0, valor: 90 }, ...opcoes];
    expect(
      filtrarPorFormasVisiveis(comZero, [1]).map((o) => o.parcelas),
    ).toEqual([0, 1]);
  });

  it("sem à vista na seleção, remove as opções <= 1", () => {
    expect(
      filtrarPorFormasVisiveis(opcoes, [6, 9]).map((o) => o.parcelas),
    ).toEqual([6, 9]);
  });
});
