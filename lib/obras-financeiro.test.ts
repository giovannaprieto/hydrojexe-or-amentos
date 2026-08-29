import { describe, expect, it } from "vitest";

import {
  calcularFinanceiroObra,
  formatPct,
  round2,
} from "@/lib/obras-financeiro";

describe("round2", () => {
  it("arredonda para 2 casas", () => {
    expect(round2(1.005)).toBe(1.0); // erro de ponto flutuante conhecido
    expect(round2(1.2345)).toBe(1.23);
    expect(round2(10)).toBe(10);
  });
});

describe("calcularFinanceiroObra", () => {
  it("cascata completa com lucro", () => {
    const fin = calcularFinanceiroObra({
      receitaBruta: 100_000,
      deducoes: 16_000,
      materiais: 40_000,
      outrosCustos: 20_000,
    });
    expect(fin.receitaLiquida).toBe(84_000);
    expect(fin.custoTotal).toBe(60_000);
    expect(fin.resultado).toBe(24_000);
    expect(fin.margem).toBeCloseTo(0.24, 5);
  });

  it("resultado negativo quando custo passa a receita líquida", () => {
    const fin = calcularFinanceiroObra({
      receitaBruta: 50_000,
      deducoes: 5_000,
      materiais: 40_000,
      outrosCustos: 10_000,
    });
    expect(fin.resultado).toBe(-5_000);
    expect(fin.margem).toBeCloseTo(-0.1, 5);
  });

  it("sem receita: tudo zera e margem é null", () => {
    const fin = calcularFinanceiroObra({
      receitaBruta: null,
      deducoes: 0,
      materiais: 1_000,
      outrosCustos: 0,
    });
    expect(fin.receitaBruta).toBe(0);
    expect(fin.resultado).toBe(-1_000);
    expect(fin.margem).toBeNull();
  });

  it("arredonda cada componente", () => {
    const fin = calcularFinanceiroObra({
      receitaBruta: 100.019,
      deducoes: 0.004,
      materiais: 0.001,
      outrosCustos: 0,
    });
    expect(fin.receitaBruta).toBe(100.02);
    expect(fin.deducoes).toBe(0);
    expect(fin.materiais).toBe(0);
  });
});

describe("formatPct", () => {
  it("null vira travessão", () => {
    expect(formatPct(null)).toBe("—");
  });
  it("formata pt-BR com 1 casa", () => {
    expect(formatPct(0.24)).toBe("24,0%");
    expect(formatPct(-0.105)).toBe("-10,5%");
  });
});
