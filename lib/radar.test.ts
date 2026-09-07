import { describe, it, expect } from "vitest";
import {
  totalPrevisto,
  calcularVencidas,
  calcularProjecoes,
  classificarRadar,
  calcularTopCategoriasDespesa,
  calcularSaldoNaData,
  calcularSerieDiaria,
  identificarSinais,
  encontrarPontoDeAtencao,
  type LancamentoParaCalculo,
  type PontoProjecao,
} from "./radar";
import { adicionarDias } from "./utils";

function lanc(overrides: Partial<LancamentoParaCalculo>): LancamentoParaCalculo {
  return {
    tipo: "receber",
    status: "previsto",
    vencimento: "2026-09-01",
    valor: 100,
    categoria_id: null,
    ...overrides,
  };
}

describe("calcularSaldoNaData — saldo atual (Dashboard/Configurações) via a mesma função do Fluxo de Caixa", () => {
  it("soma recebido e subtrai pago com data até hoje, ignorando previsto/cancelado", () => {
    const hoje = "2026-08-31";
    const amanha = adicionarDias(hoje, 1);
    const lancamentos = [
      lanc({ status: "recebido", valor: 500, data_pagamento_recebimento: "2026-08-15" }),
      lanc({ status: "pago", tipo: "pagar", valor: 200, data_pagamento_recebimento: "2026-08-20" }),
      lanc({ status: "previsto", valor: 999 }),
      lanc({ status: "cancelado", valor: 999 }),
    ];
    expect(calcularSaldoNaData(1000, lancamentos, amanha)).toBe(1300);
  });

  it("REGRESSÃO — recebimento com data futura não pode mais inflar o saldo atual do Dashboard (bug real: R$ 12.000 x R$ 10.000)", () => {
    // Cenário exato encontrado na auditoria: hoje = 31/08/2026, saldo-base
    // R$ 10.000, um "Recebido" de R$ 2.000 com data_pagamento_recebimento
    // em 05/09/2026 (futuro — puxada automaticamente do vencimento pela
    // Fase 8 quando a planilha não informa data de recebimento).
    const hoje = "2026-08-31";
    const amanha = adicionarDias(hoje, 1);
    const saldoBase = 10000;
    const lancamentos: LancamentoParaCalculo[] = [
      lanc({
        tipo: "receber",
        status: "recebido",
        valor: 2000,
        vencimento: "2026-09-05",
        data_pagamento_recebimento: "2026-09-05",
      }),
    ];

    // "Saldo atual" (Dashboard/Configurações) — mesma função, mesma âncora.
    const saldoAtualDashboard = calcularSaldoNaData(saldoBase, lancamentos, amanha);
    // Saldo do Fluxo de Caixa no próprio dia de hoje.
    const saldoFluxoDeCaixaHoje = calcularSerieDiaria({
      saldoInicial: calcularSaldoNaData(saldoBase, lancamentos, hoje),
      lancamentos,
      dataInicioISO: hoje,
      dataFimISO: hoje,
      hojeISO: hoje,
    })[0].saldoAcumulado;

    // Antes da unificação, o Dashboard mostrava 12.000 (contava o
    // recebimento futuro na hora) e o Fluxo de Caixa mostrava 10.000 no
    // mesmo dia — divergência real de R$ 2.000 para o mesmo dado.
    expect(saldoAtualDashboard).toBe(10000);
    expect(saldoFluxoDeCaixaHoje).toBe(10000);
    expect(saldoAtualDashboard).toBe(saldoFluxoDeCaixaHoje);
  });
});

describe("totalPrevisto", () => {
  it("filtra por tipo, status previsto e data-limite (inclusive)", () => {
    const lancamentos = [
      lanc({ tipo: "receber", status: "previsto", vencimento: "2026-09-01", valor: 100 }),
      lanc({ tipo: "receber", status: "previsto", vencimento: "2026-09-30", valor: 50 }),
      lanc({ tipo: "receber", status: "recebido", vencimento: "2026-09-01", valor: 999 }),
      lanc({ tipo: "pagar", status: "previsto", vencimento: "2026-09-01", valor: 999 }),
    ];
    expect(totalPrevisto(lancamentos, "receber", "2026-09-01")).toBe(100);
    expect(totalPrevisto(lancamentos, "receber", "2026-09-30")).toBe(150);
    expect(totalPrevisto(lancamentos, "receber")).toBe(150);
  });
});

describe("calcularVencidas", () => {
  it("conta só previsto com vencimento estritamente antes de hoje", () => {
    const lancamentos = [
      lanc({ tipo: "pagar", status: "previsto", vencimento: "2026-08-01", valor: 100 }),
      lanc({ tipo: "pagar", status: "previsto", vencimento: "2026-08-31", valor: 50 }),
      lanc({ tipo: "pagar", status: "pago", vencimento: "2026-08-01", valor: 999 }),
    ];
    const resultado = calcularVencidas(lancamentos, "pagar", "2026-08-31");
    expect(resultado).toEqual({ quantidade: 1, valor: 100 });
  });

  it("um lançamento que vence HOJE ainda não é vencido (borda exata)", () => {
    const lancamentos = [lanc({ tipo: "pagar", status: "previsto", vencimento: "2026-08-31", valor: 100 })];
    expect(calcularVencidas(lancamentos, "pagar", "2026-08-31").quantidade).toBe(0);
  });
});

describe("datas extremas — virada de ano e ano bissexto", () => {
  it("calcularSerieDiaria atravessa a virada de ano corretamente (31/12 → 01/01)", () => {
    const lancamentos = [
      lanc({ tipo: "receber", status: "recebido", valor: 300, data_pagamento_recebimento: "2026-01-01" }),
    ];
    const pontos = calcularSerieDiaria({
      saldoInicial: 1000,
      lancamentos,
      dataInicioISO: "2025-12-31",
      dataFimISO: "2026-01-01",
      hojeISO: "2025-12-31",
    });
    expect(pontos.map((p) => p.data)).toEqual(["2025-12-31", "2026-01-01"]);
    expect(pontos[1].saldoAcumulado).toBe(1300);
  });

  it("calcularProjecoes soma corretamente atravessando ano bissexto (29/02/2024)", () => {
    const lancamentos = [
      lanc({ tipo: "receber", status: "previsto", vencimento: "2024-02-29", valor: 500 }),
    ];
    const projecoes = calcularProjecoes(1000, lancamentos, "2024-02-20");
    const em30 = projecoes.find((p) => p.dias === 30)!;
    expect(em30.saldoProjetado).toBe(1500);
  });
});

describe("calcularProjecoes", () => {
  it("soma saldo atual + a receber - a pagar em cada horizonte", () => {
    const lancamentos = [
      lanc({ tipo: "receber", status: "previsto", vencimento: "2026-09-05", valor: 300 }),
      lanc({ tipo: "pagar", status: "previsto", vencimento: "2026-09-20", valor: 100 }),
    ];
    const projecoes = calcularProjecoes(1000, lancamentos, "2026-09-01");
    const em7 = projecoes.find((p) => p.dias === 7)!;
    const em30 = projecoes.find((p) => p.dias === 30)!;
    expect(em7.saldoProjetado).toBe(1300); // só o recebível de 5 dias entra
    expect(em30.saldoProjetado).toBe(1200); // recebível + pagável entram
  });
});

describe("classificarRadar", () => {
  it("é sempre risco quando o saldo projetado é negativo, mesmo sem caixa mínimo", () => {
    const r = classificarRadar({ saldoProjetado: -50, caixaMinimo: null, temVencidas: false, periodoDias: 30 });
    expect(r.status).toBe("risco");
  });
  it("é neutro quando não há caixa mínimo definido e o saldo não é negativo", () => {
    const r = classificarRadar({ saldoProjetado: 100, caixaMinimo: null, temVencidas: false, periodoDias: 30 });
    expect(r.status).toBe("neutro");
  });
  it("é risco quando o saldo projetado fica abaixo do caixa mínimo", () => {
    const r = classificarRadar({ saldoProjetado: 400, caixaMinimo: 500, temVencidas: false, periodoDias: 30 });
    expect(r.status).toBe("risco");
  });
  it("é atenção quando está perto do caixa mínimo (entre 1x e 1.3x)", () => {
    const r = classificarRadar({ saldoProjetado: 550, caixaMinimo: 500, temVencidas: false, periodoDias: 30 });
    expect(r.status).toBe("atencao");
  });
  it("é excesso quando o saldo é o dobro do caixa mínimo e não há vencidas", () => {
    const r = classificarRadar({ saldoProjetado: 1000, caixaMinimo: 500, temVencidas: false, periodoDias: 30 });
    expect(r.status).toBe("excesso");
  });
  it("não é excesso quando há vencidas, mesmo com saldo alto", () => {
    const r = classificarRadar({ saldoProjetado: 1000, caixaMinimo: 500, temVencidas: true, periodoDias: 30 });
    expect(r.status).toBe("saudavel");
  });
});

describe("calcularTopCategoriasDespesa", () => {
  it("agrupa despesas previstas por categoria e devolve as 3 maiores", () => {
    const categoriaPorId = new Map([["c1", "Fornecedores"], ["c2", "Aluguel"]]);
    const lancamentos = [
      lanc({ tipo: "pagar", status: "previsto", vencimento: "2026-09-01", valor: 300, categoria_id: "c1" }),
      lanc({ tipo: "pagar", status: "previsto", vencimento: "2026-09-01", valor: 200, categoria_id: "c1" }),
      lanc({ tipo: "pagar", status: "previsto", vencimento: "2026-09-01", valor: 100, categoria_id: "c2" }),
      lanc({ tipo: "pagar", status: "previsto", vencimento: "2026-09-01", valor: 10, categoria_id: null }),
    ];
    const top = calcularTopCategoriasDespesa(lancamentos, categoriaPorId, "2026-09-01");
    expect(top[0]).toEqual({ nome: "Fornecedores", valor: 500 });
  });
});

describe("Fluxo de Caixa", () => {
  it("calcularSaldoNaData só conta pagamentos/recebimentos estritamente antes da data", () => {
    const lancamentos = [
      lanc({ status: "recebido", valor: 500, data_pagamento_recebimento: "2026-09-01" }),
      lanc({ status: "recebido", valor: 100, data_pagamento_recebimento: "2026-09-10" }),
    ];
    expect(calcularSaldoNaData(1000, lancamentos, "2026-09-10")).toBe(1500);
  });

  it("calcularSerieDiaria usa data_pagamento_recebimento como âncora para pago/recebido e vencimento para previsto", () => {
    const lancamentos = [
      lanc({ tipo: "receber", status: "recebido", valor: 200, vencimento: "2026-08-20", data_pagamento_recebimento: "2026-09-02" }),
      lanc({ tipo: "pagar", status: "previsto", valor: 50, vencimento: "2026-09-03" }),
    ];
    const pontos = calcularSerieDiaria({
      saldoInicial: 1000,
      lancamentos,
      dataInicioISO: "2026-09-01",
      dataFimISO: "2026-09-05",
      hojeISO: "2026-09-01",
    });
    const dia2 = pontos.find((p) => p.data === "2026-09-02")!;
    const dia3 = pontos.find((p) => p.data === "2026-09-03")!;
    expect(dia2.entradas).toBe(200);
    expect(dia3.saidas).toBe(50);
    expect(pontos[pontos.length - 1].saldoAcumulado).toBe(1150);
  });

  it("nunca conta o mesmo lançamento em mais de um dia (uma âncora só)", () => {
    const lancamentos = [lanc({ tipo: "receber", status: "recebido", valor: 200, data_pagamento_recebimento: "2026-09-02" })];
    const pontos = calcularSerieDiaria({
      saldoInicial: 0,
      lancamentos,
      dataInicioISO: "2026-09-01",
      dataFimISO: "2026-09-05",
      hojeISO: "2026-09-01",
    });
    const totalEntradas = pontos.reduce((soma, p) => soma + p.entradas, 0);
    expect(totalEntradas).toBe(200);
  });
});

describe("identificarSinais", () => {
  it("sinaliza vencidas de pagar e receber separadamente", () => {
    const lancamentos = [
      lanc({ tipo: "pagar", status: "previsto", vencimento: "2026-08-01", valor: 100 }),
      lanc({ tipo: "receber", status: "previsto", vencimento: "2026-08-01", valor: 50 }),
    ];
    const sinais = identificarSinais({
      lancamentos,
      categoriaPorId: new Map(),
      periodoDias: 30,
      hojeISO: "2026-08-31",
    });
    expect(sinais.map((s) => s.id)).toEqual(expect.arrayContaining(["vencidas-pagar", "vencidas-receber"]));
  });
});

describe("calcularSerieDiaria — previsto nunca conta no saldo realizado (até hoje, inclusive)", () => {
  const hoje = "2026-09-01";

  it("previsto vencendo HOJE não altera o saldo de hoje (só aparece como previsto do dia)", () => {
    const lancamentos = [lanc({ tipo: "receber", status: "previsto", vencimento: hoje, valor: 50000 })];
    const pontos = calcularSerieDiaria({
      saldoInicial: 52300.5,
      lancamentos,
      dataInicioISO: hoje,
      dataFimISO: hoje,
      hojeISO: hoje,
    });
    expect(pontos[0].saldoAcumulado).toBe(52300.5);
    expect(pontos[0].entradas).toBe(0);
    expect(pontos[0].entradasPrevistas).toBe(50000);
  });

  it("previsto VENCIDO (antes de hoje) não altera o saldo realizado, e não reaparece em nenhum dia futuro", () => {
    const lancamentos = [lanc({ tipo: "pagar", status: "previsto", vencimento: "2026-08-20", valor: 300 })];
    const pontos = calcularSerieDiaria({
      saldoInicial: 1000,
      lancamentos,
      dataInicioISO: "2026-08-20",
      dataFimISO: "2026-09-03",
      hojeISO: hoje,
    });
    const diaVencido = pontos.find((p) => p.data === "2026-08-20")!;
    expect(diaVencido.saidasPrevistas).toBe(300);
    expect(diaVencido.saldoAcumulado).toBe(1000); // não contou
    expect(diaVencido.temVencido).toBe(true);
    // Nenhum dia posterior (incluindo o futuro) volta a subtrair esses 300.
    for (const p of pontos) expect(p.saldoAcumulado).toBe(1000);
  });

  it("previsto FUTURO entra só na projeção, a partir do próprio dia de vencimento", () => {
    const lancamentos = [lanc({ tipo: "receber", status: "previsto", vencimento: "2026-09-03", valor: 500 })];
    const pontos = calcularSerieDiaria({
      saldoInicial: 1000,
      lancamentos,
      dataInicioISO: hoje,
      dataFimISO: "2026-09-05",
      hojeISO: hoje,
    });
    expect(pontos.find((p) => p.data === "2026-09-01")!.saldoAcumulado).toBe(1000);
    expect(pontos.find((p) => p.data === "2026-09-02")!.saldoAcumulado).toBe(1000);
    expect(pontos.find((p) => p.data === "2026-09-03")!.saldoAcumulado).toBe(1500);
    expect(pontos.find((p) => p.data === "2026-09-05")!.saldoAcumulado).toBe(1500);
  });

  it("pago/recebido em data diferente do vencimento entra na data do PAGAMENTO, nunca no vencimento", () => {
    const lancamentos = [
      lanc({
        tipo: "receber",
        status: "recebido",
        vencimento: "2026-08-10", // vencimento antigo — deve ser ignorado
        data_pagamento_recebimento: "2026-09-01", // pago bem depois — é isto que conta
        valor: 700,
      }),
    ];
    const pontos = calcularSerieDiaria({
      saldoInicial: 0,
      lancamentos,
      dataInicioISO: "2026-08-10",
      dataFimISO: "2026-09-01",
      hojeISO: hoje,
    });
    expect(pontos.find((p) => p.data === "2026-08-10")!.saldoAcumulado).toBe(0);
    expect(pontos.find((p) => p.data === "2026-09-01")!.saldoAcumulado).toBe(700);
  });

  it("cancelado não entra em nenhum cálculo, mesmo que chegue por engano na lista", () => {
    const lancamentos = [lanc({ tipo: "receber", status: "cancelado", vencimento: hoje, valor: 99999 })];
    const pontos = calcularSerieDiaria({
      saldoInicial: 1000,
      lancamentos,
      dataInicioISO: hoje,
      dataFimISO: hoje,
      hojeISO: hoje,
    });
    expect(pontos[0].saldoAcumulado).toBe(1000);
    expect(pontos[0].entradasPrevistas).toBe(0);
  });

  it("Dashboard e Fluxo de Caixa dão o MESMO saldo de hoje, mesmo com previstos vencidos/hoje/futuros misturados", () => {
    const saldoBase = 50000;
    const lancamentos: LancamentoParaCalculo[] = [
      lanc({ tipo: "receber", status: "recebido", data_pagamento_recebimento: hoje, valor: 2300.5 }),
      lanc({ tipo: "receber", status: "previsto", vencimento: hoje, valor: 50000 }),
      lanc({ tipo: "pagar", status: "previsto", vencimento: hoje, valor: 2300 }),
      lanc({ tipo: "pagar", status: "previsto", vencimento: "2026-08-15", valor: 300 }), // vencido
      lanc({ tipo: "receber", status: "previsto", vencimento: "2026-09-10", valor: 500000 }), // futuro
      lanc({ tipo: "receber", status: "cancelado", vencimento: hoje, valor: 999999 }),
    ];

    // "Dashboard" — mesma função usada em lib/dashboard.ts.
    const saldoDashboard = calcularSaldoNaData(saldoBase, lancamentos, adicionarDias(hoje, 1));

    // "Fluxo de Caixa" — mesma função usada em lib/fluxo-caixa.ts.
    const saldoInicialFluxo = calcularSaldoNaData(saldoBase, lancamentos, adicionarDias(hoje, -7));
    const pontosFluxo = calcularSerieDiaria({
      saldoInicial: saldoInicialFluxo,
      lancamentos,
      dataInicioISO: adicionarDias(hoje, -7),
      dataFimISO: hoje,
      hojeISO: hoje,
    });
    const saldoFluxoHoje = pontosFluxo.find((p) => p.data === hoje)!.saldoAcumulado;

    expect(saldoDashboard).toBe(52300.5);
    expect(saldoFluxoHoje).toBe(52300.5);
    expect(saldoDashboard).toBe(saldoFluxoHoje);
  });
});

describe("encontrarPontoDeAtencao (Fase 10.5 — só interpreta projeções já existentes)", () => {
  const projecoes: PontoProjecao[] = [
    { dias: 7, saldoProjetado: 5000 },
    { dias: 15, saldoProjetado: 3000 },
    { dias: 30, saldoProjetado: 800 },
    { dias: 60, saldoProjetado: -200 },
    { dias: 90, saldoProjetado: -1000 },
  ];

  it("aponta o primeiro horizonte abaixo do caixa mínimo", () => {
    const resultado = encontrarPontoDeAtencao(projecoes, 1000);
    expect(resultado.emRisco).toBe(true);
    expect(resultado.mensagem).toContain("30 dias");
  });

  it("sem caixa mínimo definido, usa zero como limiar (mesma regra do classificarRadar)", () => {
    const resultado = encontrarPontoDeAtencao(projecoes, null);
    expect(resultado.emRisco).toBe(true);
    expect(resultado.mensagem).toContain("60 dias");
  });

  it("quando nenhum horizonte cruza o limite, não inventa alerta — mensagem positiva", () => {
    const semRisco: PontoProjecao[] = [
      { dias: 7, saldoProjetado: 5000 },
      { dias: 90, saldoProjetado: 4000 },
    ];
    const resultado = encontrarPontoDeAtencao(semRisco, 1000);
    expect(resultado.emRisco).toBe(false);
    expect(resultado.mensagem).toContain("90 dias");
    expect(resultado.mensagem).not.toContain("abaixo");
  });
});
