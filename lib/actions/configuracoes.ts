"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { obterEmpresaAtual } from "@/lib/empresa";
import { centavosParaReais } from "@/lib/utils";
import { logErro } from "@/lib/log";

export type ResultadoConfiguracoes = { erro: string } | null;

export type EntradaDadosEmpresa = {
  /** Cada campo é opcional: cada aba de Configurações envia só o que
   * realmente edita. Os campos omitidos são preenchidos aqui dentro com o
   * valor mais recente do banco (lido nesta mesma chamada, não o que a tela
   * tinha no carregamento) — evita que a aba "Caixa mínimo" sobrescreva um
   * nome salvo há poucos segundos pela aba "Dados da empresa", e vice-versa. */
  nome?: string;
  setor?: string;
  /** Sempre em centavos; 0 vira null (regra já usada no onboarding — não
   * ativa silenciosamente o Radar). Saldo atual não faz parte daqui: é
   * calculado dinamicamente (Fase 4) e não pode ser editado. */
  caixaMinimoCentavos?: number;
};

/**
 * Atualiza nome, setor e/ou caixa mínimo da empresa do usuário autenticado —
 * só os campos presentes em `entrada` são alterados; os demais mantêm o
 * valor atual, lido do banco nesta mesma chamada (ver comentário do tipo
 * acima). empresa_id nunca vem do cliente — resolvido aqui via
 * obterEmpresaAtual(). Protegida pela policy "empresas_update_por_vinculo",
 * já existente desde a Fase 1 — nenhuma policy nova foi necessária.
 */
export async function atualizarDadosEmpresa(
  entrada: EntradaDadosEmpresa
): Promise<ResultadoConfiguracoes> {
  const empresa = await obterEmpresaAtual();
  if (!empresa) {
    return { erro: "Empresa não encontrada." };
  }

  const nome = entrada.nome !== undefined ? entrada.nome.trim() : empresa.nome;
  const setor = entrada.setor !== undefined ? entrada.setor.trim() : empresa.setor ?? "";

  if (!nome) {
    return { erro: "Informe o nome da empresa." };
  }
  if (!setor) {
    return { erro: "Informe o setor da empresa." };
  }

  let caixaMinimo: number | null = empresa.caixaMinimo;
  if (entrada.caixaMinimoCentavos !== undefined) {
    if (!Number.isFinite(entrada.caixaMinimoCentavos) || entrada.caixaMinimoCentavos < 0) {
      return { erro: "Informe um caixa mínimo válido." };
    }
    caixaMinimo = entrada.caixaMinimoCentavos === 0 ? null : centavosParaReais(entrada.caixaMinimoCentavos);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("empresas")
    .update({ nome, setor, caixa_minimo: caixaMinimo })
    .eq("id", empresa.id);

  if (error) {
    logErro("atualizarDadosEmpresa", error, { empresaId: empresa.id });
    return { erro: "Não foi possível salvar os dados da empresa. Tente novamente." };
  }

  // Caixa mínimo e setor afetam o Radar/Dashboard e o Fluxo de Caixa —
  // revalida para não deixarem números desatualizados.
  revalidatePath("/configuracoes");
  revalidatePath("/dashboard");
  revalidatePath("/fluxo-de-caixa");
  return null;
}

export type EntradaCategoria = { nome: string; tipo: "receita" | "despesa" };

/**
 * Cria uma categoria personalizada para a empresa do usuário autenticado.
 * empresa_id nunca vem do cliente. Protegida pela policy
 * "categorias_insert_por_vinculo" (migration 0003).
 */
export async function criarCategoria(entrada: EntradaCategoria): Promise<ResultadoConfiguracoes> {
  const nome = entrada.nome.trim();

  if (!nome) {
    return { erro: "Informe o nome da categoria." };
  }
  if (entrada.tipo !== "receita" && entrada.tipo !== "despesa") {
    return { erro: "Selecione o tipo da categoria." };
  }

  const empresa = await obterEmpresaAtual();
  if (!empresa) {
    return { erro: "Empresa não encontrada." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categorias").insert({
    empresa_id: empresa.id,
    nome,
    tipo: entrada.tipo,
  });

  if (error) {
    logErro("criarCategoria", error, { empresaId: empresa.id });
    return { erro: "Não foi possível criar a categoria. Tente novamente." };
  }

  revalidatePath("/configuracoes");
  return null;
}

/**
 * Exclui uma categoria personalizada. Categorias do sistema (empresa_id
 * nulo) e categorias de outras empresas nunca são afetadas — a policy
 * "categorias_delete_por_vinculo" simplesmente não libera a exclusão
 * nesses casos (0 linhas afetadas, sem erro). Se a categoria estiver em
 * uso em algum lançamento, o próprio banco bloqueia via foreign key
 * (código 23503), sem apagar nem alterar os lançamentos existentes.
 */
export async function excluirCategoria(id: string): Promise<ResultadoConfiguracoes> {
  if (!id) return { erro: "Categoria inválida." };

  const supabase = await createClient();
  const { error } = await supabase.from("categorias").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return {
        erro: "Essa categoria está em uso em algum lançamento e não pode ser excluída.",
      };
    }
    logErro("excluirCategoria", error, { id });
    return { erro: "Não foi possível excluir a categoria. Tente novamente." };
  }

  revalidatePath("/configuracoes");
  return null;
}
