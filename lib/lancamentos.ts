import { createClient } from "@/lib/supabase/server";
import { adicionarDias, hojeISO } from "@/lib/utils";
import { logErro } from "@/lib/log";
import type { Database } from "@/types/database";

export type TipoLancamento = "pagar" | "receber";
export type StatusFiltro = "todos" | "previsto" | "pago" | "recebido" | "cancelado" | "vencido";
export type PeriodoFiltro = "hoje" | "30" | "60" | "90" | "todos";

export type Lancamento = Database["public"]["Tables"]["lancamentos"]["Row"];
export type Categoria = { id: string; nome: string };

/**
 * "Vencido" nunca é lido do banco — é sempre calculado aqui, a partir da
 * mesma regra usada na migration: status = previsto e vencimento no passado.
 */
export function ehVencido(lancamento: Pick<Lancamento, "status" | "vencimento">): boolean {
  return lancamento.status === "previsto" && lancamento.vencimento < hojeISO();
}

export async function listarCategorias(tipo: "receita" | "despesa"): Promise<Categoria[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias")
    .select("id, nome")
    .eq("tipo", tipo)
    .order("nome", { ascending: true });
  if (error) {
    logErro("listarCategorias", error, { tipo });
    throw new Error("Não foi possível carregar as categorias. Tente novamente.");
  }
  return data ?? [];
}

/**
 * Lista lançamentos de uma empresa por tipo, com filtro opcional de status
 * e período. O filtro de "vencido" não existe como coluna — é traduzido
 * aqui para (status = previsto e vencimento < hoje).
 *
 * Período filtra por "vencimento até X dias a partir de hoje" (inclui
 * vencidos, já que o vencimento deles é sempre <= hoje) — pensado para ser
 * reaproveitado pelo Dashboard e Fluxo de Caixa nas próximas fases.
 */
export async function listarLancamentos(params: {
  empresaId: string;
  tipo: TipoLancamento;
  status?: StatusFiltro;
  periodo?: PeriodoFiltro;
}): Promise<Lancamento[]> {
  const supabase = await createClient();

  let query = supabase
    .from("lancamentos")
    .select("*")
    .eq("empresa_id", params.empresaId)
    .eq("tipo", params.tipo)
    .order("vencimento", { ascending: true });

  const status = params.status ?? "todos";
  if (status === "vencido") {
    query = query.eq("status", "previsto").lt("vencimento", hojeISO());
  } else if (status !== "todos") {
    query = query.eq("status", status);
  }

  const periodo = params.periodo ?? "todos";
  if (periodo !== "todos") {
    const limite = periodo === "hoje" ? hojeISO() : adicionarDias(hojeISO(), Number(periodo));
    query = query.lte("vencimento", limite);
  }

  const { data, error } = await query;
  if (error) {
    logErro("listarLancamentos", error, { tipo: params.tipo, status: params.status });
    throw new Error("Não foi possível carregar os lançamentos. Tente novamente.");
  }
  return data ?? [];
}

/**
 * Busca um lançamento específico. Não recebe empresaId — a RLS já garante
 * que só retorna algo se o usuário autenticado tiver vínculo com a empresa
 * dona do lançamento; de outra empresa, o resultado é null (não erro),
 * evitando confirmar a existência do registro para quem não tem acesso.
 * Uma falha de conexão de verdade (não RLS) ainda assim lança, para não ser
 * confundida com "lançamento não encontrado".
 */
export async function obterLancamento(id: string): Promise<Lancamento | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("lancamentos").select("*").eq("id", id).maybeSingle();
  if (error) {
    logErro("obterLancamento", error, { id });
    throw new Error("Não foi possível carregar o lançamento. Tente novamente.");
  }
  return data;
}
