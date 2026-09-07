import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converte centavos (inteiro) para reais (number com 2 casas), evitando
 * erros de arredondamento de ponto flutuante.
 */
export function centavosParaReais(centavos: number): number {
  return Number((centavos / 100).toFixed(2));
}

export function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function adicionarDias(dataISO: string, dias: number): string {
  const data = new Date(`${dataISO}T00:00:00`);
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Valor absoluto formatado sem o prefixo "R$" — para compor dentro de frases. */
export function formatarNumeroBRL(valor: number): string {
  return Math.abs(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
