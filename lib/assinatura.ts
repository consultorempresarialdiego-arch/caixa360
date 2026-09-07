import { createClient } from "@/lib/supabase/server";
import { logErro } from "@/lib/log";

export type StatusAssinatura = "acesso_antecipado" | "ativa" | "pausada" | "cancelada";

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
