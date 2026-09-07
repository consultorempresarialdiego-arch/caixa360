"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { centavosParaReais } from "@/lib/utils";
import { logErro } from "@/lib/log";

export type MetodoInicio = "manual" | "importar";

export type EntradaOnboarding = {
  nome: string;
  setor: string;
  saldoAtualCentavos: number;
  caixaMinimoCentavos: number;
  metodoInicio: MetodoInicio;
};

export type ResultadoOnboarding = { erro: string } | null;

/**
 * Cria a empresa do onboarding chamando exclusivamente a função SQL
 * criar_empresa_inicial (SECURITY DEFINER) — nunca insere direto na tabela
 * empresas e nunca recebe usuario_id/empresa_id do cliente; auth.uid() é
 * resolvido dentro da função, no banco.
 *
 * Caixa mínimo = 0 é tratado como "não definido" (null), conforme a
 * especificação da Etapa 2: 0 nunca deve silenciosamente significar "sem
 * risco" — o Radar de Caixa (fases futuras) precisa saber que o alerta
 * está desativado, não que o caixa mínimo é literalmente zero.
 */
export async function criarEmpresa(
  entrada: EntradaOnboarding
): Promise<ResultadoOnboarding> {
  const nome = entrada.nome.trim();
  const setor = entrada.setor.trim();

  if (!nome) {
    return { erro: "Informe o nome da empresa." };
  }
  if (!setor) {
    return { erro: "Selecione o setor da empresa." };
  }
  if (!Number.isFinite(entrada.saldoAtualCentavos) || entrada.saldoAtualCentavos < 0) {
    return { erro: "Informe um saldo atual válido." };
  }
  if (!Number.isFinite(entrada.caixaMinimoCentavos) || entrada.caixaMinimoCentavos < 0) {
    return { erro: "Informe um caixa mínimo válido." };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("criar_empresa_inicial", {
    p_nome: nome,
    p_setor: setor,
    p_saldo_atual: centavosParaReais(entrada.saldoAtualCentavos),
    p_caixa_minimo:
      entrada.caixaMinimoCentavos === 0
        ? null
        : centavosParaReais(entrada.caixaMinimoCentavos),
  });

  if (error) {
    if (error.message.includes("já possui empresa vinculada")) {
      redirect("/dashboard");
    }
    if (error.message.includes("não autenticado")) {
      redirect("/login");
    }
    logErro("criarEmpresa", error);
    return {
      erro: "Não foi possível concluir a configuração da empresa. Tente novamente.",
    };
  }

  redirect(entrada.metodoInicio === "importar" ? "/importacao" : "/dashboard");
}
