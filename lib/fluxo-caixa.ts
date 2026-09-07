import { createClient } from "@/lib/supabase/server";
import { obterEmpresaAtual } from "@/lib/empresa";
import { adicionarDias, hojeISO } from "@/lib/utils";
import { logErro } from "@/lib/log";
import {
  calcularSaldoNaData,
  calcularSerieDiaria,
  type LancamentoParaCalculo,
  type PontoFluxoCaixa,
} from "@/lib/radar";

export type PeriodoFluxoCaixa = "hoje" | "30" | "60" | "90";

export const PERIODOS_FLUXO_CAIXA: { valor: PeriodoFluxoCaixa; label: string }[] = [
  { valor: "hoje", label: "Hoje" },
  { valor: "30", label: "30 dias" },
  { valor: "60", label: "60 dias" },
  { valor: "90", label: "90 dias" },
];

export type FluxoCaixaData =
  | { temEmpresa: false }
  | {
      temEmpresa: true;
      empresaNome: string;
      temLancamentos: boolean;
      periodo: PeriodoFluxoCaixa;
      pontos: PontoFluxoCaixa[];
    };

/**
 * Intervalo exibido por período (regra aprovada na Fase 6 — passado +
 * presente + futuro, sempre com histórico realizado visível):
 * - hoje: últimos 7 dias + hoje.
 * - 30/60/90: últimos 30 dias fixos + próximos 30/60/90 dias.
 */
function intervaloPara(periodo: PeriodoFluxoCaixa, hoje: string): { inicio: string; fim: string } {
  switch (periodo) {
    case "hoje":
      return { inicio: adicionarDias(hoje, -7), fim: hoje };
    case "30":
      return { inicio: adicionarDias(hoje, -30), fim: adicionarDias(hoje, 30) };
    case "60":
      return { inicio: adicionarDias(hoje, -30), fim: adicionarDias(hoje, 60) };
    case "90":
      return { inicio: adicionarDias(hoje, -30), fim: adicionarDias(hoje, 90) };
  }
}

export async function montarFluxoCaixa(periodo: PeriodoFluxoCaixa): Promise<FluxoCaixaData> {
  const empresa = await obterEmpresaAtual();
  if (!empresa) return { temEmpresa: false };

  const supabase = await createClient();
  const { data: lancamentosData, error } = await supabase
    .from("lancamentos")
    .select("tipo, status, vencimento, valor, categoria_id, data_pagamento_recebimento")
    .eq("empresa_id", empresa.id)
    .neq("status", "cancelado");

  if (error) {
    logErro("montarFluxoCaixa", error, { empresaId: empresa.id });
    throw new Error("Não foi possível carregar o Fluxo de Caixa. Tente novamente.");
  }

  const lancamentos: LancamentoParaCalculo[] = lancamentosData ?? [];
  const hoje = hojeISO();
  const { inicio, fim } = intervaloPara(periodo, hoje);

  const saldoInicial = calcularSaldoNaData(empresa.saldoAtual, lancamentos, inicio);
  const pontos = calcularSerieDiaria({
    saldoInicial,
    lancamentos,
    dataInicioISO: inicio,
    dataFimISO: fim,
    hojeISO: hoje,
  });

  return {
    temEmpresa: true,
    empresaNome: empresa.nome,
    temLancamentos: lancamentos.length > 0,
    periodo,
    pontos,
  };
}
