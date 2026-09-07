import { createClient } from "@/lib/supabase/server";
import { logErro } from "@/lib/log";

/**
 * Verifica se o usuário autenticado já tem ao menos uma empresa vinculada.
 * Usado para decidir entre encaminhar para /onboarding ou liberar /dashboard
 * e demais telas da área autenticada.
 *
 * Uma falha de conexão aqui NUNCA deve ser lida como "sem empresa" — isso
 * mandaria um usuário com empresa configurada de volta para o onboarding.
 * Por isso lança (o error.tsx da área logada mostra uma tela amigável) em
 * vez de devolver false silenciosamente.
 */
export async function usuarioTemEmpresaVinculada(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("usuarios_empresas").select("id").limit(1);
  if (error) {
    logErro("usuarioTemEmpresaVinculada", error);
    throw new Error("Não foi possível verificar sua empresa. Tente novamente.");
  }
  return !!data && data.length > 0;
}

export type EmpresaAtual = {
  id: string;
  nome: string;
  setor: string | null;
  saldoAtual: number;
  caixaMinimo: number | null;
};

/**
 * Resolve a empresa do usuário autenticado a partir do vínculo em
 * usuarios_empresas — nunca a partir de um valor vindo do cliente. Usada
 * pelas telas e Server Actions de Contas a Pagar/Receber e pelo Dashboard.
 *
 * saldoAtual aqui é o saldo-base gravado no onboarding — o Dashboard (Fase
 * 4) calcula o saldo dinâmico em cima dele, sem que esta tabela seja
 * alterada quando um lançamento é pago/recebido.
 */
export async function obterEmpresaAtual(): Promise<EmpresaAtual | null> {
  const supabase = await createClient();

  const { data: vinculo, error: erroVinculo } = await supabase
    .from("usuarios_empresas")
    .select("empresa_id")
    .limit(1)
    .maybeSingle();

  if (erroVinculo) {
    logErro("obterEmpresaAtual.vinculo", erroVinculo);
    throw new Error("Não foi possível carregar sua empresa. Tente novamente.");
  }
  if (!vinculo) return null;

  const { data: empresa, error: erroEmpresa } = await supabase
    .from("empresas")
    .select("id, nome, setor, saldo_atual, caixa_minimo")
    .eq("id", vinculo.empresa_id)
    .maybeSingle();

  if (erroEmpresa) {
    logErro("obterEmpresaAtual.empresa", erroEmpresa);
    throw new Error("Não foi possível carregar sua empresa. Tente novamente.");
  }
  if (!empresa) return null;

  return {
    id: empresa.id,
    nome: empresa.nome,
    setor: empresa.setor,
    saldoAtual: empresa.saldo_atual,
    caixaMinimo: empresa.caixa_minimo,
  };
}
