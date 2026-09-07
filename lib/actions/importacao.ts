"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { obterEmpresaAtual } from "@/lib/empresa";
import { validarLinhaEstrutural, type StatusLancamento } from "@/lib/importacao/validacao";
import { logErro } from "@/lib/log";

export type LinhaParaImportar = {
  tipo: "pagar" | "receber";
  clienteFornecedor: string;
  descricao: string;
  categoriaId: string | null;
  vencimento: string; // yyyy-mm-dd
  valorCentavos: number;
  status: StatusLancamento;
  dataPagamentoRecebimento: string | null;
  observacao: string;
};

export type ResultadoImportacao =
  | { erro: string }
  | {
      sucesso: true;
      importadas: number;
      ignoradas: number;
      duplicidadesPuladas: number;
    };

const TAMANHO_LOTE = 500;

/**
 * Grava os lançamentos já interpretados e validados no navegador. Nada é
 * gravado antes desta chamada (o usuário chega aqui só ao clicar em
 * "Confirmar importação"). empresa_id nunca vem do cliente — é sempre
 * resolvido aqui via obterEmpresaAtual(). Cada linha é revalidada
 * estruturalmente no servidor (defesa em profundidade — mesmo padrão de
 * criarLancamento/atualizarLancamento). O log em "importacoes" é gravado
 * DEPOIS dos lançamentos, como auditoria — se ele falhar, não desfaz nem
 * impede a importação já concluída.
 */
export async function importarLancamentos(params: {
  linhas: LinhaParaImportar[];
  arquivoNome: string;
  formato: "xlsx" | "csv";
  totalLinhasPlanilha: number;
  duplicidadesPuladas: number;
}): Promise<ResultadoImportacao> {
  const empresa = await obterEmpresaAtual();
  if (!empresa) {
    return { erro: "Empresa não encontrada." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { erro: "Sessão expirada. Faça login novamente." };
  }

  const linhasValidas = params.linhas.filter(
    (l) =>
      validarLinhaEstrutural({
        tipo: l.tipo,
        clienteFornecedor: l.clienteFornecedor,
        descricao: l.descricao,
        vencimento: l.vencimento,
        valorCentavos: l.valorCentavos,
        status: l.status,
      }) === null
  );

  const ignoradas = params.linhas.length - linhasValidas.length;

  const registros = linhasValidas.map((l) => ({
    empresa_id: empresa.id,
    tipo: l.tipo,
    cliente_fornecedor: l.clienteFornecedor.trim(),
    descricao: l.descricao.trim(),
    categoria_id: l.categoriaId,
    vencimento: l.vencimento,
    valor: Number((l.valorCentavos / 100).toFixed(2)),
    status: l.status,
    data_pagamento_recebimento: l.dataPagamentoRecebimento,
    observacao: l.observacao.trim() || null,
    origem: "importado" as const,
  }));

  let importadas = 0;
  for (let i = 0; i < registros.length; i += TAMANHO_LOTE) {
    const lote = registros.slice(i, i + TAMANHO_LOTE);
    const { error, data } = await supabase.from("lancamentos").insert(lote).select("id");
    if (error) {
      logErro("importarLancamentos", error, { empresaId: empresa.id, arquivo: params.arquivoNome });
      await registrarLog(supabase, {
        empresaId: empresa.id,
        usuarioId: user.id,
        arquivoNome: params.arquivoNome,
        formato: params.formato,
        status: "falhou",
        totalLinhas: params.totalLinhasPlanilha,
        linhasImportadas: importadas,
        linhasIgnoradas: params.linhas.length - importadas,
        duplicidadesIdentificadas: params.duplicidadesPuladas,
      });
      return {
        erro:
          "Falha ao gravar os lançamentos. Parte da planilha pode não ter sido importada — confira em Contas a Pagar/Receber.",
      };
    }
    importadas += data?.length ?? lote.length;
  }

  await registrarLog(supabase, {
    empresaId: empresa.id,
    usuarioId: user.id,
    arquivoNome: params.arquivoNome,
    formato: params.formato,
    status: "concluida",
    totalLinhas: params.totalLinhasPlanilha,
    linhasImportadas: importadas,
    linhasIgnoradas: ignoradas,
    duplicidadesIdentificadas: params.duplicidadesPuladas,
  });

  revalidatePath("/contas-a-pagar");
  revalidatePath("/contas-a-receber");
  revalidatePath("/dashboard");
  revalidatePath("/fluxo-de-caixa");

  return { sucesso: true, importadas, ignoradas, duplicidadesPuladas: params.duplicidadesPuladas };
}

async function registrarLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entrada: {
    empresaId: string;
    usuarioId: string;
    arquivoNome: string;
    formato: "xlsx" | "csv";
    status: "concluida" | "falhou";
    totalLinhas: number;
    linhasImportadas: number;
    linhasIgnoradas: number;
    duplicidadesIdentificadas: number;
  }
): Promise<void> {
  try {
    const { error } = await supabase.from("importacoes").insert({
      empresa_id: entrada.empresaId,
      usuario_id: entrada.usuarioId,
      arquivo_nome: entrada.arquivoNome,
      formato: entrada.formato,
      status: entrada.status,
      total_linhas: entrada.totalLinhas,
      linhas_importadas: entrada.linhasImportadas,
      linhas_ignoradas: entrada.linhasIgnoradas,
      duplicidades_identificadas: entrada.duplicidadesIdentificadas,
    });
    if (error) logErro("registrarLog.importacoes", error, { empresaId: entrada.empresaId });
  } catch (erro) {
    // Auditoria não deve travar nem reverter a importação já gravada — só registra.
    logErro("registrarLog.importacoes", erro, { empresaId: entrada.empresaId });
  }
}
