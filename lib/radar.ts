/**
 * Regras de cálculo do Radar de Caixa e dos indicadores do Dashboard
 * (Fase 4). Funções puras — não acessam o banco, não conhecem RLS/sessão.
 * Recebem lançamentos já buscados (respeitando RLS na camada que chamou) e
 * devolvem números/classificações. Pensadas para serem reaproveitadas pelo
 * Fluxo de Caixa em uma fase futura, sem duplicar a lógica de projeção.
 */
import { adicionarDias, formatarNumeroBRL } from "@/lib/utils";

export type LancamentoParaCalculo = {
  tipo: "pagar" | "receber";
  status: string;
  vencimento: string; // yyyy-mm-dd
  valor: number;
  categoria_id: string | null;
  /** Opcional: só é usado pelo Fluxo de Caixa (data em que o dinheiro
   * realmente moveu, para lançamentos pago/recebido). Ausente = a chamadora
   * não precisou buscar essa coluna (ex.: Dashboard). */
  data_pagamento_recebimento?: string | null;
};

function arredondar(valor: number): number {
  return Number(valor.toFixed(2));
}

function somar(lancamentos: LancamentoParaCalculo[]): number {
  return lancamentos.reduce((total, l) => total + l.valor, 0);
}

/** Soma de lançamentos "previsto" de um tipo, opcionalmente até uma data-limite. */
export function totalPrevisto(
  lancamentos: LancamentoParaCalculo[],
  tipo: "pagar" | "receber",
  limiteISO?: string
): number {
  return arredondar(
    somar(
      lancamentos.filter(
        (l) => l.tipo === tipo && l.status === "previsto" && (!limiteISO || l.vencimento <= limiteISO)
      )
    )
  );
}

export type Vencidas = { quantidade: number; valor: number };

export function calcularVencidas(
  lancamentos: LancamentoParaCalculo[],
  tipo: "pagar" | "receber",
  hojeISO: string
): Vencidas {
  const vencidos = lancamentos.filter(
    (l) => l.tipo === tipo && l.status === "previsto" && l.vencimento < hojeISO
  );
  return { quantidade: vencidos.length, valor: arredondar(somar(vencidos)) };
}

export const HORIZONTES_PROJECAO = [7, 15, 30, 60, 90] as const;
export type Horizonte = (typeof HORIZONTES_PROJECAO)[number];
export type PontoProjecao = { dias: Horizonte; saldoProjetado: number };

/**
 * Saldo projetado (X dias) = Saldo atual + recebimentos previstos até
 * hoje+X − pagamentos previstos até hoje+X (fórmula da especificação,
 * seção G). Calculado para os 5 horizontes fixos de uma vez.
 */
export function calcularProjecoes(
  saldoAtual: number,
  lancamentos: LancamentoParaCalculo[],
  hojeISO: string
): PontoProjecao[] {
  return HORIZONTES_PROJECAO.map((dias) => {
    const limite = adicionarDias(hojeISO, dias);
    const receber = totalPrevisto(lancamentos, "receber", limite);
    const pagar = totalPrevisto(lancamentos, "pagar", limite);
    return { dias, saldoProjetado: arredondar(saldoAtual + receber - pagar) };
  });
}

export type PontoDeAtencao = { emRisco: boolean; mensagem: string };

/**
 * "Próximo ponto de atenção" do Dashboard comercial (Fase 10.5) — só
 * INTERPRETA os horizontes de `calcularProjecoes`, que já são a fonte
 * validada de verdade; não faz nenhuma conta financeira nova. Usa o mesmo
 * limiar de risco que `classificarRadar` já usa (abaixo do caixa mínimo
 * quando definido, ou abaixo de zero quando não há caixa mínimo), então a
 * mensagem nunca contradiz a classificação do Radar.
 */
export function encontrarPontoDeAtencao(
  projecoes: PontoProjecao[],
  caixaMinimo: number | null
): PontoDeAtencao {
  const limite = caixaMinimo ?? 0;
  const primeiroEmRisco = projecoes.find((p) => p.saldoProjetado < limite);
  const ultimoHorizonte = projecoes[projecoes.length - 1]?.dias ?? 90;

  if (primeiroEmRisco) {
    return {
      emRisco: true,
      mensagem: `Seu caixa pode ficar abaixo ${
        caixaMinimo !== null ? "do mínimo desejado" : "de zero"
      } em ${primeiroEmRisco.dias} dias.`,
    };
  }

  return {
    emRisco: false,
    mensagem:
      caixaMinimo !== null
        ? `Seu caixa permanece acima do mínimo projetado nos próximos ${ultimoHorizonte} dias.`
        : `Seu caixa permanece positivo nos próximos ${ultimoHorizonte} dias.`,
  };
}

export type StatusRadar = "saudavel" | "atencao" | "risco" | "excesso" | "neutro";
export type ClassificacaoRadar = { status: StatusRadar; mensagem: string };

/**
 * Classificação principal do Radar — tabela exata da especificação (seção
 * F), com duas prioridades adicionadas por cima (aprovadas na Fase 4):
 * saldo projetado negativo é sempre "risco", mesmo sem caixa mínimo
 * definido; ausência de caixa mínimo é "neutro" (nunca finge que está tudo
 * bem).
 */
export function classificarRadar(params: {
  saldoProjetado: number;
  caixaMinimo: number | null;
  temVencidas: boolean;
  periodoDias: number;
}): ClassificacaoRadar {
  const { saldoProjetado, caixaMinimo, temVencidas, periodoDias } = params;

  if (saldoProjetado < 0) {
    return {
      status: "risco",
      mensagem: `Seu caixa projetado fica negativo em R$ ${formatarNumeroBRL(saldoProjetado)} daqui a ${periodoDias} dias.`,
    };
  }

  if (caixaMinimo === null) {
    return {
      status: "neutro",
      mensagem: "Defina seu caixa mínimo para ativar os alertas de risco do Radar.",
    };
  }

  if (saldoProjetado < caixaMinimo) {
    return {
      status: "risco",
      mensagem: `Seu caixa projetado ficará R$ ${formatarNumeroBRL(
        caixaMinimo - saldoProjetado
      )} abaixo do mínimo desejado em ${periodoDias} dias.`,
    };
  }

  if (saldoProjetado < caixaMinimo * 1.3) {
    return {
      status: "atencao",
      mensagem: `Seu caixa ficará próximo do mínimo desejado em ${periodoDias} dias. Vale acompanhar de perto.`,
    };
  }

  if (saldoProjetado >= caixaMinimo * 2 && !temVencidas) {
    return {
      status: "excesso",
      mensagem: "Você pode ter caixa disponível acima do necessário — considere investir o excedente.",
    };
  }

  return {
    status: "saudavel",
    mensagem: `Seu caixa está saudável nos próximos ${periodoDias} dias.`,
  };
}

export type CategoriaDespesa = { nome: string; valor: number };

/** Top 3 categorias de despesa prevista até a data-limite, maior valor primeiro. */
export function calcularTopCategoriasDespesa(
  lancamentos: LancamentoParaCalculo[],
  categoriaPorId: Map<string, string>,
  limiteISO: string
): CategoriaDespesa[] {
  const porCategoria = new Map<string, number>();
  for (const l of lancamentos) {
    if (l.tipo !== "pagar" || l.status !== "previsto" || l.vencimento > limiteISO) continue;
    const nome = l.categoria_id ? categoriaPorId.get(l.categoria_id) ?? "Outras" : "Outras";
    porCategoria.set(nome, (porCategoria.get(nome) ?? 0) + l.valor);
  }
  return [...porCategoria.entries()]
    .map(([nome, valor]) => ({ nome, valor: arredondar(valor) }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 3);
}

// ----------------------------------------------------------------------------
// Fluxo de Caixa (Fase 6)
// ----------------------------------------------------------------------------

/**
 * Data "âncora" de um lançamento na linha do tempo do Fluxo de Caixa
 * (regra aprovada na Fase 6):
 * - pago/recebido → data_pagamento_recebimento (quando o dinheiro moveu de
 *   verdade);
 * - previsto (inclusive vencido) → vencimento original — um vencido nunca
 *   "pula" de dia, só é destacado visualmente (ver temVencido).
 * - cancelado → nunca chega aqui (é filtrado antes, na busca dos dados).
 * Cada lançamento tem exatamente uma âncora, então nunca é contado em mais
 * de um dia.
 */
function dataAncora(l: LancamentoParaCalculo): string | null {
  if (l.status === "pago" || l.status === "recebido") {
    return l.data_pagamento_recebimento || null;
  }
  if (l.status === "previsto") {
    return l.vencimento;
  }
  return null;
}

/**
 * Fonte única de cálculo de saldo consolidado (Decisão A1, unificada no
 * Bloco 2 da Fase 9): saldo-base do onboarding + tudo que já foi
 * efetivamente recebido/pago com `data_pagamento_recebimento` ANTES de
 * dataISO (exclusivo). Nunca olha "previsto" (isso é projeção, não saldo
 * confirmado) e nunca escreve na tabela empresas — é recalculado a cada
 * leitura.
 *
 * Usada tanto pelo Fluxo de Caixa (ponto de partida da série diária, com
 * dataISO = início do período) quanto pelo Dashboard/Configurações ("saldo
 * atual" = esta mesma função com dataISO = amanhã, incluindo tudo até hoje
 * e excluindo qualquer movimento com data futura). Antes desta unificação,
 * o Dashboard tinha uma função própria que somava pago/recebido sem olhar
 * a data — causava divergência real com o Fluxo de Caixa sempre que um
 * lançamento concluído tinha `data_pagamento_recebimento` no futuro.
 */
export function calcularSaldoNaData(
  saldoBase: number,
  lancamentos: LancamentoParaCalculo[],
  dataISO: string
): number {
  const recebido = somar(
    lancamentos.filter(
      (l) => l.status === "recebido" && !!l.data_pagamento_recebimento && l.data_pagamento_recebimento < dataISO
    )
  );
  const pago = somar(
    lancamentos.filter(
      (l) => l.status === "pago" && !!l.data_pagamento_recebimento && l.data_pagamento_recebimento < dataISO
    )
  );
  return arredondar(saldoBase + recebido - pago);
}

export type MomentoFluxo = "realizado" | "hoje" | "previsto";

export type PontoFluxoCaixa = {
  data: string; // yyyy-mm-dd
  /** Movimento que efetivamente entra no saldo deste dia: realizado se o
   * dia é hoje ou passado, previsto se o dia é futuro. */
  entradas: number;
  saidas: number;
  /** Só preenchido em dias ≤ hoje: previsto ancorado neste dia (inclusive
   * vencido) que NÃO entrou no saldo — existe só para a tabela continuar
   * mostrando o previsto do dia, sem ele contar na conta. Em dias futuros
   * fica zerado (o previsto do dia já está em `entradas`/`saidas` ali). */
  entradasPrevistas: number;
  saidasPrevistas: number;
  saldoDia: number;
  saldoAcumulado: number;
  momento: MomentoFluxo;
  temVencido: boolean;
};

/**
 * Série diária do Fluxo de Caixa entre dataInicioISO e dataFimISO
 * (inclusive nos dois extremos).
 *
 * Regra de negócio (Fase 9, Bloco 2 — corrigida após achado real de
 * divergência com o Dashboard): "previsto" NUNCA soma no saldo de um dia
 * que já é hoje ou passado, mesmo que seu vencimento seja exatamente hoje
 * ou esteja vencido — só dinheiro que já entrou/saiu de verdade
 * (pago/recebido, ancorado em `data_pagamento_recebimento`) conta até
 * hoje, inclusive. A partir de amanhã, a série vira projeção: o saldo
 * continua a partir do saldo realizado de hoje, somando os previstos no
 * dia do próprio vencimento — um previsto vencido ou vencendo hoje nunca
 * "pula" para um dia futuro, ele só deixa de contar (fica visível na
 * tabela como previsto/vencido, sem afetar o saldo). Cancelados já devem
 * ter sido excluídos de `lancamentos` antes de chegar aqui (quem busca os
 * dados faz isso, como já era feito no Dashboard).
 */
export function calcularSerieDiaria(params: {
  saldoInicial: number;
  lancamentos: LancamentoParaCalculo[];
  dataInicioISO: string;
  dataFimISO: string;
  hojeISO: string;
}): PontoFluxoCaixa[] {
  const { saldoInicial, lancamentos, dataInicioISO, dataFimISO, hojeISO } = params;

  type Bucket = { entradas: number; saidas: number };
  const porDiaRealizado = new Map<string, Bucket>();
  const porDiaPrevisto = new Map<string, Bucket>();
  const diasComVencido = new Set<string>();

  function somar(mapa: Map<string, Bucket>, dia: string, tipo: "pagar" | "receber", valor: number) {
    const bucket = mapa.get(dia) ?? { entradas: 0, saidas: 0 };
    if (tipo === "receber") bucket.entradas += valor;
    else bucket.saidas += valor;
    mapa.set(dia, bucket);
  }

  for (const l of lancamentos) {
    const ancora = dataAncora(l);
    if (!ancora || ancora < dataInicioISO || ancora > dataFimISO) continue;

    if (l.status === "previsto") {
      somar(porDiaPrevisto, ancora, l.tipo, l.valor);
      if (l.vencimento < hojeISO) diasComVencido.add(ancora);
    } else {
      // pago ou recebido — sempre ancorado em data_pagamento_recebimento,
      // independentemente do vencimento original.
      somar(porDiaRealizado, ancora, l.tipo, l.valor);
    }
  }

  const pontos: PontoFluxoCaixa[] = [];
  let acumulado = saldoInicial;
  let cursor = dataInicioISO;

  while (cursor <= dataFimISO) {
    const ehFuturo = cursor > hojeISO;
    const realizadoDia = porDiaRealizado.get(cursor) ?? { entradas: 0, saidas: 0 };
    const previstoDia = porDiaPrevisto.get(cursor) ?? { entradas: 0, saidas: 0 };

    // Até hoje (inclusive): só o realizado do dia entra no saldo — nunca
    // previsto. A partir de amanhã: previsto do dia entra na projeção, e
    // um realizado com data futura (raro, mas possível — o mesmo caso do
    // pagamento com data no futuro) também soma no seu próprio dia, nunca
    // antes disso.
    const contaNoSaldo = ehFuturo
      ? {
          entradas: previstoDia.entradas + realizadoDia.entradas,
          saidas: previstoDia.saidas + realizadoDia.saidas,
        }
      : realizadoDia;
    const saldoDia = arredondar(contaNoSaldo.entradas - contaNoSaldo.saidas);
    acumulado = arredondar(acumulado + saldoDia);

    pontos.push({
      data: cursor,
      entradas: arredondar(contaNoSaldo.entradas),
      saidas: arredondar(contaNoSaldo.saidas),
      entradasPrevistas: ehFuturo ? 0 : arredondar(previstoDia.entradas),
      saidasPrevistas: ehFuturo ? 0 : arredondar(previstoDia.saidas),
      saldoDia,
      saldoAcumulado: acumulado,
      momento: cursor < hojeISO ? "realizado" : cursor === hojeISO ? "hoje" : "previsto",
      temVencido: diasComVencido.has(cursor),
    });

    cursor = adicionarDias(cursor, 1);
  }

  return pontos;
}

export type Sinal = { id: string; mensagem: string };

/**
 * Sinais independentes do Radar (Decisão D da Fase 4) — cada um só aparece
 * se for relevante, em ordem de prioridade (vencidas primeiro, por serem o
 * risco mais objetivo e urgente). A classificação principal do Radar
 * (classificarRadar) já cobre "abaixo do caixa mínimo"/"negativo"; esta
 * lista cobre o que a classificação principal não expressa sozinha.
 */
export function identificarSinais(params: {
  lancamentos: LancamentoParaCalculo[];
  categoriaPorId: Map<string, string>;
  periodoDias: number;
  hojeISO: string;
}): Sinal[] {
  const { lancamentos, categoriaPorId, periodoDias, hojeISO } = params;
  const limite = adicionarDias(hojeISO, periodoDias);
  const sinais: Sinal[] = [];

  const vencidasPagar = calcularVencidas(lancamentos, "pagar", hojeISO);
  const vencidasReceber = calcularVencidas(lancamentos, "receber", hojeISO);

  if (vencidasPagar.quantidade > 0) {
    sinais.push({
      id: "vencidas-pagar",
      mensagem: `${vencidasPagar.quantidade} conta(s) a pagar vencida(s), totalizando R$ ${formatarNumeroBRL(vencidasPagar.valor)}.`,
    });
  }
  if (vencidasReceber.quantidade > 0) {
    sinais.push({
      id: "vencidas-receber",
      mensagem: `${vencidasReceber.quantidade} conta(s) a receber vencida(s), totalizando R$ ${formatarNumeroBRL(vencidasReceber.valor)}.`,
    });
  }

  const pagarPeriodo = totalPrevisto(lancamentos, "pagar", limite);
  const receberPeriodo = totalPrevisto(lancamentos, "receber", limite);
  if (pagarPeriodo > receberPeriodo && pagarPeriodo > 0) {
    sinais.push({
      id: "insuficiencia-recebimentos",
      mensagem: `Nos próximos ${periodoDias} dias, os pagamentos previstos (R$ ${formatarNumeroBRL(
        pagarPeriodo
      )}) superam os recebimentos previstos (R$ ${formatarNumeroBRL(receberPeriodo)}).`,
    });
  }

  const topCategorias = calcularTopCategoriasDespesa(lancamentos, categoriaPorId, limite);
  if (topCategorias.length > 0 && pagarPeriodo > 0) {
    const principal = topCategorias[0];
    const participacao = principal.valor / pagarPeriodo;
    if (participacao > 0.4) {
      sinais.push({
        id: "concentracao-despesas",
        mensagem: `"${principal.nome}" concentra ${(participacao * 100).toFixed(0)}% das despesas previstas no período (R$ ${formatarNumeroBRL(
          principal.valor
        )}).`,
      });
    }
  }

  return sinais;
}
