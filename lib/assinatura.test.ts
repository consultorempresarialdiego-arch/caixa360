import { describe, it, expect } from "vitest";
import { acessoLiberado, HORAS_CARENCIA_PENDENTE, type AssinaturaAtual } from "./assinatura";

function horasAtras(horas: number): string {
  return new Date(Date.now() - horas * 60 * 60 * 1000).toISOString();
}

describe("acessoLiberado", () => {
  it("libera quando não há registro de assinatura", () => {
    expect(acessoLiberado(null)).toBe(true);
  });

  it("libera status ativa", () => {
    const assinatura: AssinaturaAtual = { status: "ativa", inicioEm: horasAtras(1000) };
    expect(acessoLiberado(assinatura)).toBe(true);
  });

  it("libera status acesso_antecipado, mesmo muito antigo", () => {
    const assinatura: AssinaturaAtual = { status: "acesso_antecipado", inicioEm: horasAtras(10000) };
    expect(acessoLiberado(assinatura)).toBe(true);
  });

  it("libera pendente dentro da carência", () => {
    const assinatura: AssinaturaAtual = { status: "pendente", inicioEm: horasAtras(HORAS_CARENCIA_PENDENTE - 1) };
    expect(acessoLiberado(assinatura)).toBe(true);
  });

  it("bloqueia pendente após a carência", () => {
    const assinatura: AssinaturaAtual = { status: "pendente", inicioEm: horasAtras(HORAS_CARENCIA_PENDENTE + 1) };
    expect(acessoLiberado(assinatura)).toBe(false);
  });

  it("bloqueia pausada", () => {
    const assinatura: AssinaturaAtual = { status: "pausada", inicioEm: horasAtras(1) };
    expect(acessoLiberado(assinatura)).toBe(false);
  });

  it("bloqueia cancelada", () => {
    const assinatura: AssinaturaAtual = { status: "cancelada", inicioEm: horasAtras(1) };
    expect(acessoLiberado(assinatura)).toBe(false);
  });
});
