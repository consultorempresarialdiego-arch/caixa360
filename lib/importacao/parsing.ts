/**
 * Leitura de arquivos .xlsx/.csv — SEMPRE roda no navegador (nunca no
 * servidor). Isso é uma decisão de segurança deliberada: a biblioteca
 * `xlsx` (SheetJS) tem vulnerabilidades conhecidas sem correção disponível
 * (Prototype Pollution, ReDoS) — mantendo o parsing client-side, o pior
 * cenário é travar a própria aba de quem enviou o arquivo, sem expor o
 * servidor nem outras empresas/usuários.
 */
import * as XLSX from "xlsx";

export type LinhaBruta = Record<string, string>;

export type ArquivoLido = {
  headers: string[];
  linhas: LinhaBruta[];
  formato: "xlsx" | "csv";
};

const LIMITE_TAMANHO_BYTES = 5 * 1024 * 1024; // 5 MB
export const LIMITE_LINHAS = 5000;

export function validarArquivo(file: File): string | null {
  const nome = file.name.toLowerCase();
  const ehXlsx = nome.endsWith(".xlsx");
  const ehCsv = nome.endsWith(".csv");
  if (!ehXlsx && !ehCsv) {
    return "Envie um arquivo .xlsx ou .csv.";
  }
  if (file.size > LIMITE_TAMANHO_BYTES) {
    return "O arquivo excede o limite de 5 MB.";
  }
  return null;
}

function celulaParaTexto(valor: unknown): string {
  if (valor instanceof Date) {
    const dia = String(valor.getDate()).padStart(2, "0");
    const mes = String(valor.getMonth() + 1).padStart(2, "0");
    const ano = valor.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }
  if (valor === null || valor === undefined) return "";
  return String(valor).trim();
}

/** Detecta "," ou ";" olhando a primeira linha não vazia do CSV. */
function detectarSeparadorCsv(texto: string): "," | ";" {
  const primeiraLinha = texto.split(/\r?\n/).find((l) => l.trim() !== "") ?? "";
  const qtdVirgula = (primeiraLinha.match(/,/g) ?? []).length;
  const qtdPontoVirgula = (primeiraLinha.match(/;/g) ?? []).length;
  return qtdPontoVirgula > qtdVirgula ? ";" : ",";
}

export async function lerArquivo(file: File): Promise<{ dados?: ArquivoLido; erro?: string }> {
  try {
    const formato: "xlsx" | "csv" = file.name.toLowerCase().endsWith(".csv") ? "csv" : "xlsx";
    let workbook: XLSX.WorkBook;

    if (formato === "csv") {
      const texto = await file.text();
      const separador = detectarSeparadorCsv(texto);
      // raw: true — impede a biblioteca de tentar adivinhar datas/números a
      // partir do texto do CSV (ela usa convenção americana: mês/dia e ponto
      // decimal, incompatível com nosso formato dia/mês e vírgula decimal).
      // Tudo chega como string, e quem interpreta é interpretarData()/
      // interpretarValorMonetario(), que já tratam o formato brasileiro.
      workbook = XLSX.read(texto, { type: "string", FS: separador, raw: true });
    } else {
      const buffer = await file.arrayBuffer();
      // cellDates: true — datas do Excel viram objetos Date reais, em vez
      // de texto formatado de forma dependente de locale (evita ambiguidade
      // dd/mm x mm/dd na conversão).
      workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    }

    const primeiraAba = workbook.SheetNames[0];
    if (!primeiraAba) return { erro: "O arquivo está vazio." };
    const planilha = workbook.Sheets[primeiraAba];

    const linhasArray = XLSX.utils.sheet_to_json<unknown[]>(planilha, {
      header: 1,
      raw: true,
      defval: "",
    });

    if (linhasArray.length === 0) {
      return { erro: "O arquivo está vazio." };
    }

    const headers = (linhasArray[0] as unknown[]).map((h) => celulaParaTexto(h));
    const linhasDeDados = linhasArray.slice(1);

    if (linhasDeDados.length > LIMITE_LINHAS) {
      return { erro: `O arquivo tem mais de ${LIMITE_LINHAS} linhas. Divida em arquivos menores.` };
    }

    const linhas: LinhaBruta[] = linhasDeDados
      .filter((linha) => linha.some((v) => celulaParaTexto(v) !== ""))
      .map((linha) => {
        const obj: LinhaBruta = {};
        headers.forEach((h, i) => {
          obj[h] = celulaParaTexto(linha[i]);
        });
        return obj;
      });

    if (linhas.length === 0) {
      return { erro: "Nenhuma linha de dados encontrada no arquivo." };
    }

    return { dados: { headers, linhas, formato } };
  } catch {
    return { erro: "Não foi possível ler o arquivo. Verifique se ele não está corrompido." };
  }
}

/** Gera e baixa um modelo de planilha .xlsx com as colunas esperadas. */
export function gerarTemplateXlsx(): void {
  const cabecalho = [
    "Tipo",
    "Cliente/Fornecedor",
    "Descrição",
    "Categoria",
    "Vencimento",
    "Valor",
    "Status",
    "Data de Pagamento/Recebimento",
    "Observação",
  ];
  const exemplo1 = [
    "Receber",
    "Cliente Exemplo Ltda",
    "Venda de produtos",
    "Vendas",
    "15/09/2026",
    "R$ 1.500,00",
    "Previsto",
    "",
    "",
  ];
  const exemplo2 = [
    "Pagar",
    "Fornecedor Exemplo Ltda",
    "Compra de insumos",
    "Fornecedores",
    "10/09/2026",
    "R$ 850,00",
    "Previsto",
    "",
    "",
  ];

  const planilha = XLSX.utils.aoa_to_sheet([cabecalho, exemplo1, exemplo2]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, planilha, "Importação");
  XLSX.writeFile(workbook, "CAIXA360 Importacao.xlsx");
}
