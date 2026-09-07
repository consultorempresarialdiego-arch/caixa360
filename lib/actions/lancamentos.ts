"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { obterEmpresaAtual } from "@/lib/empresa";
import { centavosParaReais, hojeISO } from "@/lib/utils";
import { logErro } from "@/lib/log";

export type TipoLancamento = "pagar" | "receber";
export type ResultadoLancamento = { erro: string } | null;

export type EntradaLancamento = {
  tipo: TipoLancamento;
  clienteFornecedor: string;
  descricao: string;
  categoriaId: string;
  vencimento: string; // yyyy-mm-dd
  valorCentavos: number;
  observacao: string;
};

function caminhoLista(tipo: TipoLancamento): string {
  return tipo === "pagar" ? "/contas-a-pagar" : "/contas-a-receber";
}

function validarEntrada(entrada: EntradaLancamento): string | null {
  if (!entrada.clienteFornecedor.trim()) {
    return entrada.tipo === "pagar" ? "Informe o fornecedor." : "Informe o cliente.";
  }
  if (!entrada.descricao.trim()) {
    return "Informe a descrição.";
  }
  if (!entrada.categoriaId) {
    return "Selecione uma categoria.";
  }
  if (!entrada.vencimento) {
    return "Informe a data de vencimento.";
  }
  if (!Number.isFinite(entrada.valorCentavos) || entrada.valorCentavos <= 0) {
    return "Informe um valor maior que zero.";
  }
  return null;
}

/**
 * Cria um lançamento (Conta a Pagar ou a Receber) para a empresa do usuário
 * autenticado. empresa_id nunca vem do cliente — é sempre resolvido aqui,
 * no servidor, a partir do vínculo em usuarios_empresas. status sempre
 * começa como "previsto"; não é um campo do formulário.
 */
export async function criarLancamento(entrada: EntradaLancamento): Promise<ResultadoLancamento> {
  const erroValidacao = validarEntrada(entrada);
  if (erroValidacao) return { erro: erroValidacao };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { erro: "Sua sessão expirou. Faça login novamente." };
  }

  const empresa = await obterEmpresaAtual();
  if (!empresa) {
    redirect("/onboarding");
  }

  const { error } = await supabase.from("lancamentos").insert({
    empresa_id: empresa.id,
    tipo: entrada.tipo,
    cliente_fornecedor: entrada.clienteFornecedor.trim(),
    descricao: entrada.descricao.trim(),
    categoria_id: entrada.categoriaId,
    vencimento: entrada.vencimento,
    valor: centavosParaReais(entrada.valorCentavos),
    observacao: entrada.observacao.trim() || null,
  });

  if (error) {
    logErro("criarLancamento", error, { empresaId: empresa.id, tipo: entrada.tipo });
    return { erro: "Não foi possível salvar o lançamento. Tente novamente." };
  }

  revalidatePath(caminhoLista(entrada.tipo));
  revalidatePath("/dashboard");
  redirect(caminhoLista(entrada.tipo));
}

/**
 * Atualiza os dados de um lançamento já existente. A empresa não é
 * reenviada nem alterável — a RLS (update com "with check") garante que só
 * é possível editar um lançamento da própria empresa.
 */
export async function atualizarLancamento(
  id: string,
  entrada: EntradaLancamento
): Promise<ResultadoLancamento> {
  const erroValidacao = validarEntrada(entrada);
  if (erroValidacao) return { erro: erroValidacao };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { erro: "Sua sessão expirou. Faça login novamente." };
  }

  const { error, data } = await supabase
    .from("lancamentos")
    .update({
      cliente_fornecedor: entrada.clienteFornecedor.trim(),
      descricao: entrada.descricao.trim(),
      categoria_id: entrada.categoriaId,
      vencimento: entrada.vencimento,
      valor: centavosParaReais(entrada.valorCentavos),
      observacao: entrada.observacao.trim() || null,
    })
    .eq("id", id)
    .select("id");

  if (error) {
    logErro("atualizarLancamento", error, { id });
    return { erro: "Não foi possível atualizar o lançamento. Tente novamente." };
  }
  if (!data || data.length === 0) {
    // RLS bloqueou (ou o registro não existe mais) — sem isso, um update
    // que afeta 0 linhas seguia direto para "sucesso" silenciosamente.
    logErro("atualizarLancamento.nenhumaLinhaAfetada", "0 linhas afetadas", { id });
    return { erro: "Não foi possível atualizar o lançamento. Tente novamente." };
  }

  revalidatePath(caminhoLista(entrada.tipo));
  revalidatePath("/dashboard");
  redirect(caminhoLista(entrada.tipo));
}

/**
 * Marca um lançamento "previsto" como concluído — "pago" (Contas a Pagar)
 * ou "recebido" (Contas a Receber), conforme o tipo. Só funciona a partir
 * do status "previsto": um lançamento cancelado não pode ser concluído
 * depois (a cláusula .eq("status", "previsto") barra isso no próprio banco,
 * além da RLS).
 */
export async function concluirLancamento(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const tipo = String(formData.get("tipo") || "");
  if (!id || (tipo !== "pagar" && tipo !== "receber")) return;

  const novoStatus = tipo === "pagar" ? "pago" : "recebido";
  const supabase = await createClient();

  const { error } = await supabase
    .from("lancamentos")
    .update({ status: novoStatus, data_pagamento_recebimento: hojeISO() })
    .eq("id", id)
    .eq("tipo", tipo)
    .eq("status", "previsto");

  if (error) logErro("concluirLancamento", error, { id, tipo });

  revalidatePath(caminhoLista(tipo));
  revalidatePath("/dashboard");
}

/**
 * Cancela um lançamento "previsto" (soft — permanece no banco e no
 * histórico). Só funciona a partir de "previsto": não é possível cancelar
 * algo que já foi pago/recebido, nem cancelar de novo algo já cancelado.
 */
export async function cancelarLancamento(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const tipo = String(formData.get("tipo") || "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("lancamentos")
    .update({ status: "cancelado" })
    .eq("id", id)
    .eq("status", "previsto");

  if (error) logErro("cancelarLancamento", error, { id });

  if (tipo === "pagar" || tipo === "receber") {
    revalidatePath(caminhoLista(tipo));
    revalidatePath("/dashboard");
  }
}

/**
 * Reverte um lançamento "pago"/"recebido" de volta para "previsto" — corrige
 * um clique em "Marcar como pago/recebido" feito por engano. Só funciona a
 * partir do status concluído correspondente ao tipo (pago para "pagar",
 * recebido para "receber"); não reverte um lançamento cancelado.
 */
export async function reverterLancamento(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const tipo = String(formData.get("tipo") || "");
  if (!id || (tipo !== "pagar" && tipo !== "receber")) return;

  const statusOrigem = tipo === "pagar" ? "pago" : "recebido";
  const supabase = await createClient();

  const { error } = await supabase
    .from("lancamentos")
    .update({ status: "previsto", data_pagamento_recebimento: null })
    .eq("id", id)
    .eq("tipo", tipo)
    .eq("status", statusOrigem);

  if (error) logErro("reverterLancamento", error, { id, tipo });

  revalidatePath(caminhoLista(tipo));
  revalidatePath("/dashboard");
}
