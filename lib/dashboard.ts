import { createClient } from "@/lib/supabase/server";
import { obterEmpresaAtual } from "@/lib/empresa";
import { adicionarDias, hojeISO } from "@/lib/utils";
import { logErro } from "@/lib/log";
import {
  calcularProjecoes,
  calcularSaldoNaData,
  calcularTopCategoriasDespesa,
  calcularVencidas,
  classificarRadar,
  identificarSinais,
  totalPrevisto,
  type CategoriaDespesa,
  type ClassificacaoRadar,
  type LancamentoParaCalculo,
  type PontoProjecao,
  type Sinal,
  type Vencidas,
} from "@/lib/radar";

export type PeriodoDashboard = 7 | 15 | 30 | 60 | 90;
export const PERIODOS_DASHBOARD: PeriodoDashboard[] = [7, 15, 30, 60, 90];
export const PERIODO_PADRAO: PeriodoDashboard = 30;

export type DashboardData =
  | { temEmpresa: false }
  | {
      temEmpresa: true;
      empresaNome: string;
      temLancamentos: boolean;
      temContasReceber: boolean;
      temContasPagar: boolean;
      periodoDias: PeriodoDashboard;
      saldoAtual: number;
      caixaMinimo: number | null;
      totalReceberPrevisto: number;
      totalPagarPrevisto: number;
      resultadoPrevisto: number;
      vencidas: { pagar: Vencidas; receber: Vencidas };
      projecoes: PontoProjecao[];
      radar: ClassificacaoRadar;
      sinais: Sinal[];
      topCategoriasDespesa: CategoriaDespesa[];
    };

/**
 * Busca os dados da empresa do usuário autenticado (RLS aplicada pelo
 * client server-side, empresa_id nunca vem do cliente) e monta o modelo
 * completo do Dashboard. Toda a matemática vive em lib/radar.ts — aqui só
 * busca dado e orquestra.
 */
export async function montarDashboard(periodoDias: PeriodoDashboard): Promise<DashboardData> {
  const empresa = await obterEmpresaAtual();
  if (!empresa) return { temEmpresa: false };

  const supabase = await createClient();

  const [
    { data: lancamentosData, error: erroLancamentos },
    { data: categoriasData, error: erroCategorias },
  ] = await Promise.all([
    supabase
      .from("lancamentos")
      .select("tipo, status, vencimento, valor, categoria_id, data_pagamento_recebimento")
      .eq("empresa_id", empresa.id)
      .neq("status", "cancelado"),
    supabase.from("categorias").select("id, nome"),
  ]);

  if (erroLancamentos || erroCategorias) {
    logErro("montarDashboard", erroLancamentos ?? erroCategorias, { empresaId: empresa.id });
    throw new Error("Não foi possível carregar os dados do Dashboard. Tente novamente.");
  }

  const lancamentos: LancamentoParaCalculo[] = lancamentosData ?? [];
  const categoriaPorId = new Map((categoriasData ?? []).map((c) => [c.id, c.nome]));
  const hoje = hojeISO();
  const limitePeriodo = adicionarDias(hoje, periodoDias);

  // Saldo atual = saldo consolidado até o fim de hoje (mesma função e mesma
  // semântica usadas pelo Fluxo de Caixa) — nunca uma fórmula própria do
  // Dashboard, para as duas telas nunca divergirem no mesmo instante.
  const saldoAtual = calcularSaldoNaData(empresa.saldoAtual, lancamentos, adicionarDias(hoje, 1));
  const totalReceberPrevisto = totalPrevisto(lancamentos, "receber", limitePeriodo);
  const totalPagarPrevisto = totalPrevisto(lancamentos, "pagar", limitePeriodo);
  const vencidasPagar = calcularVencidas(lancamentos, "pagar", hoje);
  const vencidasReceber = calcularVencidas(lancamentos, "receber", hoje);
  const projecoes = calcularProjecoes(saldoAtual, lancamentos, hoje);
  const saldoNoPeriodo =
    projecoes.find((p) => p.dias === periodoDias)?.saldoProjetado ?? saldoAtual;

  const radar = classificarRadar({
    saldoProjetado: saldoNoPeriodo,
    caixaMinimo: empresa.caixaMinimo,
    temVencidas: vencidasPagar.quantidade > 0 || vencidasReceber.quantidade > 0,
    periodoDias,
  });

  const sinais = identificarSinais({ lancamentos, categoriaPorId, periodoDias, hojeISO: hoje });
  const topCategoriasDespesa = calcularTopCategoriasDespesa(lancamentos, categoriaPorId, limitePeriodo);

  return {
    temEmpresa: true,
    empresaNome: empresa.nome,
    temLancamentos: lancamentos.length > 0,
    temContasReceber: lancamentos.some((l) => l.tipo === "receber"),
    temContasPagar: lancamentos.some((l) => l.tipo === "pagar"),
    periodoDias,
    saldoAtual,
    caixaMinimo: empresa.caixaMinimo,
    totalReceberPrevisto,
    totalPagarPrevisto,
    resultadoPrevisto: Number((totalReceberPrevisto - totalPagarPrevisto).toFixed(2)),
    vencidas: { pagar: vencidasPagar, receber: vencidasReceber },
    projecoes,
    radar,
    sinais,
    topCategoriasDespesa,
  };
}
