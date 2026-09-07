/**
 * Regras de negócio da importação — funções puras, sem acesso a banco.
 * Usadas tanto no navegador (pré-visualização) quanto no servidor
 * (revalidação estrutural antes de gravar), para nunca duplicar regra.
 */
import type { LinhaBruta } from "./parsing";

export type CampoImportacao =
  | "tipo"
  | "clienteFornecedor"
  | "descricao"
  | "categoria"
  | "vencimento"
  | "valor"
  | "status"
  | "dataPagamentoRecebimento"
  | "observacao";

const SINONIMOS: Record<CampoImportacao, string[]> = {
  tipo: ["tipo", "tipo de lancamento", "pagar ou receber"],
  clienteFornecedor: ["cliente", "fornecedor", "cliente/fornecedor", "cliente fornecedor", "contraparte"],
  descricao: ["descricao", "historico", "titulo"],
  categoria: ["categoria"],
  vencimento: ["vencimento", "data de vencimento", "data vencimento", "due date", "data"],
  valor: ["valor", "valor (r$)", "montante", "valor total"],
  status: ["status", "situacao"],
  dataPagamentoRecebimento: [
    "data de pagamento",
    "data de recebimento",
    "data pagamento/recebimento",
    "data de pagamento/recebimento",
    "data baixa",
    "data de baixa",
  ],
  observacao: ["observacao", "obs", "nota", "notas"],
};

const REGEX_ACENTOS = new RegExp("[̀-ͯ]", "g");

function normalizarTexto(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(REGEX_ACENTOS, "").trim();
}

/** Identifica automaticamente qual coluna da planilha corresponde a cada campo. */
export function sugerirMapeamento(headers: string[]): Partial<Record<CampoImportacao, string>> {
  const mapeamento: Partial<Record<CampoImportacao, string>> = {};
  const headersNormalizados = headers.map((h) => ({ original: h, normalizado: normalizarTexto(h) }));

  (Object.keys(SINONIMOS) as CampoImportacao[]).forEach((campo) => {
    const candidatos = SINONIMOS[campo].map(normalizarTexto);
    const encontrado = headersNormalizados.find((h) => candidatos.includes(h.normalizado));
    if (encontrado) {
      mapeamento[campo] = encontrado.original;
    }
  });

  return mapeamento;
}

/**
 * Confirma que ano/mes/dia formam uma data real do calendário (rejeita
 * 31/04, 29/02 fora de ano bissexto etc.) — deixar o JS fazer essa conta
 * (em vez de tabelas de dias-por-mês escritas à mão) garante que anos
 * bissextos são tratados certo sem lógica extra.
 */
function ehDataCalendarioValida(ano: number, mes: number, dia: number): boolean {
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

/** dd/mm/aaaa, dd/mm/aa, aaaa-mm-dd ou serial do Excel → yyyy-mm-dd, ou null se inválida. */
export function interpretarData(valor: string): string | null {
  const v = valor.trim();
  if (!v) return null;

  let m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const [, ano, mes, dia] = m;
    if (!ehDataCalendarioValida(Number(ano), Number(mes), Number(dia))) return null;
    return `${ano}-${mes}-${dia}`;
  }

  m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const dia = m[1].padStart(2, "0");
    const mes = m[2].padStart(2, "0");
    let ano = m[3];
    if (ano.length === 2) ano = `20${ano}`;
    const diaNum = Number(dia);
    const mesNum = Number(mes);
    const anoNum = Number(ano);
    if (diaNum < 1 || diaNum > 31 || mesNum < 1 || mesNum > 12) return null;
    if (!ehDataCalendarioValida(anoNum, mesNum, diaNum)) return null;
    return `${ano}-${mes}-${dia}`;
  }

  if (/^\d+(\.\d+)?$/.test(v)) {
    const serial = Number(v);
    const data = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
    if (!isNaN(data.getTime())) {
      return data.toISOString().slice(0, 10);
    }
  }

  return null;
}

/** "R$ 1.234,56", "1234,56", "1234.56" → centavos (inteiro), ou null se inválido. */
export function interpretarValorMonetario(valor: string): number | null {
  let v = valor.trim();
  if (!v) return null;
  v = v.replace(/^R\$\s?/i, "").trim();
  if (!v) return null;

  const temVirgula = v.includes(",");
  const temPonto = v.includes(".");

  let normalizado: string;
  if (temVirgula && temPonto) {
    normalizado = v.replace(/\./g, "").replace(",", ".");
  } else if (temVirgula) {
    normalizado = v.replace(",", ".");
  } else {
    normalizado = v;
  }

  const numero = Number(normalizado);
  if (!Number.isFinite(numero)) return null;
  return Math.round(numero * 100);
}

export type TipoPlanilha = { modo: "fixo"; tipo: "pagar" | "receber" } | { modo: "coluna" };

export type NivelMensagem = "erro" | "aviso";
export type MensagemLinha = { nivel: NivelMensagem; texto: string };

export type StatusLancamento = "previsto" | "pago" | "recebido" | "cancelado";

export type LinhaInterpretada = {
  indice: number; // número da linha na planilha, para as mensagens
  tipo: "pagar" | "receber" | null;
  clienteFornecedor: string;
  descricao: string;
  categoriaNome: string;
  categoriaId: string | null;
  vencimento: string | null; // ISO
  valorCentavos: number | null;
  status: StatusLancamento;
  dataPagamentoRecebimento: string | null;
  observacao: string;
  mensagens: MensagemLinha[];
  possivelDuplicata: boolean;
  pronta: boolean; // sem nenhum erro
};

export type CategoriaParaMatch = { id: string; nome: string; tipo: "receita" | "despesa" };
export type LancamentoExistente = {
  tipo: "pagar" | "receber";
  cliente_fornecedor: string;
  vencimento: string;
  valor: number;
  status: string;
};

function normalizarNome(texto: string): string {
  return texto.trim().toLowerCase();
}

/**
 * Interpreta e valida uma linha da planilha, aplicando todas as regras
 * aprovadas: tipo (fixo ou por coluna), cliente/fornecedor obrigatório,
 * descrição obrigatória, categoria por nome exato (sem criar categoria
 * nova), status (vencido nunca é armazenado), data de pagamento aproximada
 * pelo vencimento quando ausente, e detecção de possível duplicidade.
 */
export function interpretarLinha(params: {
  indice: number;
  bruta: LinhaBruta;
  mapeamento: Partial<Record<CampoImportacao, string>>;
  tipoPlanilha: TipoPlanilha;
  categorias: CategoriaParaMatch[];
  existentes: LancamentoExistente[];
}): LinhaInterpretada {
  const { indice, bruta, mapeamento, tipoPlanilha, categorias, existentes } = params;
  const mensagens: MensagemLinha[] = [];

  function campo(nomeCampo: CampoImportacao): string {
    const coluna = mapeamento[nomeCampo];
    if (!coluna) return "";
    return (bruta[coluna] ?? "").trim();
  }

  // Tipo
  let tipo: "pagar" | "receber" | null = null;
  if (tipoPlanilha.modo === "fixo") {
    tipo = tipoPlanilha.tipo;
  } else {
    const bruto = normalizarTexto(campo("tipo"));
    if (["pagar", "despesa", "saida", "pagamento"].includes(bruto)) tipo = "pagar";
    else if (["receber", "receita", "entrada", "recebimento"].includes(bruto)) tipo = "receber";
    else mensagens.push({ nivel: "erro", texto: "Tipo não reconhecido (esperado pagar/receber)." });
  }

  // Cliente/Fornecedor — obrigatório, sem valor padrão (aprovado)
  const clienteFornecedor = campo("clienteFornecedor");
  if (!clienteFornecedor) {
    mensagens.push({
      nivel: "erro",
      texto: tipo === "pagar" ? "Fornecedor ausente." : "Cliente ausente.",
    });
  }

  // Descrição
  const descricao = campo("descricao");
  if (!descricao) {
    mensagens.push({ nivel: "erro", texto: "Descrição ausente." });
  }

  // Vencimento
  const vencimentoTexto = campo("vencimento");
  const vencimento = interpretarData(vencimentoTexto);
  if (!vencimentoTexto) {
    mensagens.push({ nivel: "erro", texto: "Vencimento ausente." });
  } else if (!vencimento) {
    mensagens.push({ nivel: "erro", texto: `Data de vencimento inválida ("${vencimentoTexto}").` });
  }

  // Valor
  const valorTexto = campo("valor");
  const valorCentavos = interpretarValorMonetario(valorTexto);
  if (!valorTexto) {
    mensagens.push({ nivel: "erro", texto: "Valor ausente." });
  } else if (valorCentavos === null) {
    mensagens.push({ nivel: "erro", texto: `Valor inválido ("${valorTexto}").` });
  } else if (valorCentavos <= 0) {
    mensagens.push({ nivel: "erro", texto: "Valor deve ser maior que zero." });
  }

  // Categoria — nunca cria automaticamente; nome exato, sem diferenciar
  // maiúsculas/minúsculas, dentro do tipo certo (receita/despesa)
  const categoriaNome = campo("categoria");
  let categoriaId: string | null = null;
  if (categoriaNome && tipo) {
    const tipoCategoria = tipo === "pagar" ? "despesa" : "receita";
    const encontrada = categorias.find(
      (c) => c.tipo === tipoCategoria && normalizarNome(c.nome) === normalizarNome(categoriaNome)
    );
    if (encontrada) {
      categoriaId = encontrada.id;
    } else {
      mensagens.push({
        nivel: "aviso",
        texto: `Categoria "${categoriaNome}" não encontrada — importado sem categoria.`,
      });
    }
  }

  // Status — "vencido" nunca é armazenado (vira "previsto"); vocabulário
  // pago/recebido específico por tipo, igual ao resto do sistema
  const statusOriginal = campo("status");
  const statusTexto = normalizarTexto(statusOriginal);
  let status: StatusLancamento = "previsto";
  if (!statusTexto || statusTexto === "previsto" || statusTexto === "vencido") {
    status = "previsto";
  } else if (statusTexto === "cancelado") {
    status = "cancelado";
  } else if (tipo === "pagar" && statusTexto === "pago") {
    status = "pago";
  } else if (tipo === "receber" && statusTexto === "recebido") {
    status = "recebido";
  } else if (["pago", "recebido", "concluido", "baixado"].includes(statusTexto)) {
    status = tipo === "pagar" ? "pago" : "recebido";
  } else {
    mensagens.push({ nivel: "aviso", texto: `Status "${statusOriginal}" não reconhecido — tratado como "previsto".` });
    status = "previsto";
  }

  // Data de pagamento/recebimento — aproxima pelo vencimento quando ausente
  let dataPagamentoRecebimento: string | null = null;
  if (status === "pago" || status === "recebido") {
    const dataTexto = campo("dataPagamentoRecebimento");
    const dataInterpretada = dataTexto ? interpretarData(dataTexto) : null;
    if (dataInterpretada) {
      dataPagamentoRecebimento = dataInterpretada;
    } else {
      dataPagamentoRecebimento = vencimento;
      mensagens.push({
        nivel: "aviso",
        texto: "Data de pagamento/recebimento não informada — usando a data de vencimento.",
      });
    }
  }

  const observacao = campo("observacao");

  // Duplicidade — heurística por empresa+tipo+cliente/fornecedor+vencimento+valor
  let possivelDuplicata = false;
  if (tipo && vencimento && valorCentavos !== null && clienteFornecedor) {
    const valorReais = Number((valorCentavos / 100).toFixed(2));
    possivelDuplicata = existentes.some(
      (e) =>
        (e.status !== "cancelado" || status === "cancelado") &&
        e.tipo === tipo &&
        e.vencimento === vencimento &&
        Math.abs(e.valor - valorReais) < 0.005 &&
        normalizarNome(e.cliente_fornecedor) === normalizarNome(clienteFornecedor)
    );
    if (possivelDuplicata) {
      mensagens.push({ nivel: "aviso", texto: "Possível duplicata de um lançamento já existente." });
    }
  }

  const pronta = !mensagens.some((m) => m.nivel === "erro");

  return {
    indice,
    tipo,
    clienteFornecedor,
    descricao,
    categoriaNome,
    categoriaId,
    vencimento,
    valorCentavos,
    status,
    dataPagamentoRecebimento,
    observacao,
    mensagens,
    possivelDuplicata,
    pronta,
  };
}

/**
 * Revalidação estrutural leve — usada no servidor antes de gravar, como
 * segunda camada independente da validação já feita no navegador (mesmo
 * padrão de defesa em profundidade das demais Server Actions do projeto).
 */
export function validarLinhaEstrutural(linha: {
  tipo: "pagar" | "receber";
  clienteFornecedor: string;
  descricao: string;
  vencimento: string;
  valorCentavos: number;
  status: StatusLancamento;
}): string | null {
  if (linha.tipo !== "pagar" && linha.tipo !== "receber") return "tipo inválido";
  if (!linha.clienteFornecedor.trim()) return "cliente/fornecedor ausente";
  if (!linha.descricao.trim()) return "descrição ausente";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(linha.vencimento)) return "vencimento inválido";
  if (!Number.isFinite(linha.valorCentavos) || linha.valorCentavos <= 0) return "valor inválido";
  const statusValidoPagar: StatusLancamento[] = ["previsto", "pago", "cancelado"];
  const statusValidoReceber: StatusLancamento[] = ["previsto", "recebido", "cancelado"];
  const validos = linha.tipo === "pagar" ? statusValidoPagar : statusValidoReceber;
  if (!validos.includes(linha.status)) return "status inválido";
  return null;
}
