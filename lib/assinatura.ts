import { createClient } from "@/lib/supabase/server";
import { logErro } from "@/lib/log";

export type StatusAssinatura = "pendente" | "acesso_antecipado" | "ativa" | "pausada" | "cancelada";

/**
 * Status comercial da empresa (Fase 10.3) — sem plano/preço/cobrança ainda.
 * Retorna null só quando a empresa legitimamente não tem registro (não
 * deveria acontecer depois do backfill da migration 0006, mas é tratado sem
 * quebrar a tela). Erro de conexão de verdade lança, não vira "sem status".
 */
export async function obterStatusAssinatura(empresaId: string): Promise<StatusAssinatura | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assinaturas")
    .select("status")
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (error) {
    logErro("obterStatusAssinatura", error, { empresaId });
    throw new Error("Não foi possível carregar o status da sua conta. Tente novamente.");
  }

  return data?.status ?? null;
}

export type AssinaturaAtual = {
  status: StatusAssinatura;
  inicioEm: string;
};

/**
 * Mesma consulta de obterStatusAssinatura, mas também traz inicio_em —
 * necessário pra calcular a carência do status "pendente" em acessoLiberado.
 */
export async function obterAssinaturaAtual(empresaId: string): Promise<AssinaturaAtual | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assinaturas")
    .select("status, inicio_em")
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (error) {
    logErro("obterAssinaturaAtual", error, { empresaId });
    throw new Error("Não foi possível carregar o status da sua conta. Tente novamente.");
  }
  if (!data) return null;

  return { status: data.status, inicioEm: data.inicio_em };
}

/** Empresa nova aguardando confirmação manual de pagamento continua com
 * acesso liberado por até 48h a partir da criação — evita bloquear um
 * cliente que acabou de pagar antes de o pagamento ser conferido e o status
 * ser trocado para "ativa" manualmente. Passado esse prazo sem confirmação,
 * o acesso é bloqueado até a liberação. */
export const HORAS_CARENCIA_PENDENTE = 48;

/**
 * Decide se o usuário autenticado pode acessar a área logada, a partir do
 * status comercial da empresa. Sem registro de assinatura (não deveria
 * acontecer, ver obterAssinaturaAtual) libera — a ausência de dado nunca
 * deve travar quem já tem empresa configurada.
 */
export function acessoLiberado(assinatura: AssinaturaAtual | null): boolean {
  if (!assinatura) return true;
  if (assinatura.status === "ativa" || assinatura.status === "acesso_antecipado") return true;
  if (assinatura.status === "pendente") {
    const horasDesdeInicio = (Date.now() - new Date(assinatura.inicioEm).getTime()) / (1000 * 60 * 60);
    return horasDesdeInicio < HORAS_CARENCIA_PENDENTE;
  }
  return false;
}
