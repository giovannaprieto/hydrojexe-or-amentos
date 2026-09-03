import { describe, expect, it } from "vitest";

import {
  FORMAS_PAGAMENTO_BASE,
  filtrarPorFormasVisiveis,
  modoParcelamento,
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
  it("modo nenhum: usa a própria coluna", () => {
    for (const n of [1, 6, 9, 12, 24, 36]) {
      expect(parcelasOrigemPreco(n, "nenhum")).toBe(n);
    }
  });

  it("modo padrão: 9x usa 6x, 12x usa 9x; à vista/6x/24x inalterados", () => {
    expect(parcelasOrigemPreco(9, "padrao")).toBe(6);
    expect(parcelasOrigemPreco(12, "padrao")).toBe(9);
    expect(parcelasOrigemPreco(1, "padrao")).toBe(1);
    expect(parcelasOrigemPreco(6, "padrao")).toBe(6);
    expect(parcelasOrigemPreco(24, "padrao")).toBe(24);
  });

  it("modo longo: 12x usa 6x, 24x usa 9x, 36x usa 12x; à vista/6x/9x inalterados", () => {
    expect(parcelasOrigemPreco(12, "longo")).toBe(6);
    expect(parcelasOrigemPreco(24, "longo")).toBe(9);
    expect(parcelasOrigemPreco(36, "longo")).toBe(12);
    expect(parcelasOrigemPreco(1, "longo")).toBe(1);
    expect(parcelasOrigemPreco(6, "longo")).toBe(6);
    expect(parcelasOrigemPreco(9, "longo")).toBe(9);
  });
});

describe("modoParcelamento", () => {
  it("sem parcelamento especial = nenhum", () => {
    expect(modoParcelamento(null)).toBe("nenhum");
    expect(modoParcelamento({ parcelamento_especial: false })).toBe("nenhum");
    expect(
      modoParcelamento({
        parcelamento_especial: false,
        parcelamento_especial_modo: "longo",
      }),
    ).toBe("nenhum");
  });

  it("ligado, sem modo ou modo desconhecido = padrão", () => {
    expect(modoParcelamento({ parcelamento_especial: true })).toBe("padrao");
    expect(
      modoParcelamento({
        parcelamento_especial: true,
        parcelamento_especial_modo: "xpto",
      }),
    ).toBe("padrao");
  });

  it("ligado + modo longo = longo", () => {
    expect(
      modoParcelamento({
        parcelamento_especial: true,
        parcelamento_especial_modo: "longo",
      }),
    ).toBe("longo");
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
