import { describe, it, expect } from "vitest";
import {
  interpretarData,
  interpretarValorMonetario,
  sugerirMapeamento,
  interpretarLinha,
  validarLinhaEstrutural,
  type LancamentoExistente,
} from "./validacao";

describe("interpretarData", () => {
  it("aceita ISO (yyyy-mm-dd)", () => {
    expect(interpretarData("2026-09-05")).toBe("2026-09-05");
  });
  it("aceita dd/mm/aaaa", () => {
    expect(interpretarData("05/09/2026")).toBe("2026-09-05");
  });
  it("aceita dd/mm/aa (assume 20xx)", () => {
    expect(interpretarData("05/09/26")).toBe("2026-09-05");
  });
  it("rejeita mês inválido", () => {
    expect(interpretarData("05/13/2026")).toBeNull();
  });
  it("rejeita texto vazio ou não reconhecido", () => {
    expect(interpretarData("")).toBeNull();
    expect(interpretarData("não é uma data")).toBeNull();
  });
  it("29/02 em ano bissexto é válido", () => {
    expect(interpretarData("29/02/2024")).toBe("2024-02-29"); // 2024 é bissexto
  });
  it("rejeita 29/02 em ano NÃO bissexto (regressão do gap encontrado na auditoria)", () => {
    expect(interpretarData("29/02/2025")).toBeNull(); // 2025 não é bissexto
  });
  it("rejeita dia inexistente em mês de 30 dias (31/04)", () => {
    expect(interpretarData("31/04/2026")).toBeNull();
  });
  it("rejeita a mesma data inválida também no formato ISO (2025-02-29)", () => {
    expect(interpretarData("2025-02-29")).toBeNull();
  });
});

describe("interpretarValorMonetario", () => {
  it("aceita formato BR com milhar e centavos: R$ 1.234,56", () => {
    expect(interpretarValorMonetario("R$ 1.234,56")).toBe(123456);
  });
  it("aceita BR sem prefixo: 1234,56", () => {
    expect(interpretarValorMonetario("1234,56")).toBe(123456);
  });
  it("aceita formato americano: 1234.56", () => {
    expect(interpretarValorMonetario("1234.56")).toBe(123456);
  });
  it("rejeita vazio e texto inválido", () => {
    expect(interpretarValorMonetario("")).toBeNull();
    expect(interpretarValorMonetario("não é um valor")).toBeNull();
  });
});

describe("sugerirMapeamento", () => {
  it("reconhece cabeçalho com acento e variações de nome", () => {
    const mapeamento = sugerirMapeamento(["Cliente/Fornecedor", "Descrição", "Vencimento", "Valor"]);
    expect(mapeamento.clienteFornecedor).toBe("Cliente/Fornecedor");
    expect(mapeamento.descricao).toBe("Descrição");
  });
});

describe("interpretarLinha — duplicidade", () => {
  const mapeamentoPadrao = {
    clienteFornecedor: "Cliente",
    descricao: "Descricao",
    categoria: "Categoria",
    vencimento: "Vencimento",
    valor: "Valor",
    status: "Status",
  };

  function linhaZeta(existentes: LancamentoExistente[]) {
    return interpretarLinha({
      indice: 2,
      bruta: {
        Cliente: "Cliente Zeta",
        Descricao: "Pedido cancelado",
        Categoria: "Vendas",
        Vencimento: "05/09/2026",
        Valor: "300,00",
        Status: "Cancelado",
      },
      mapeamento: mapeamentoPadrao,
      tipoPlanilha: { modo: "fixo", tipo: "receber" },
      categorias: [{ id: "cat-vendas", nome: "Vendas", tipo: "receita" }],
      existentes,
    });
  }

  it("reconhece um lançamento cancelado repetido como duplicata (regressão do bug de reimportação)", () => {
    const resultado = linhaZeta([
      { tipo: "receber", cliente_fornecedor: "Cliente Zeta", vencimento: "2026-09-05", valor: 300, status: "cancelado" },
    ]);
    expect(resultado.status).toBe("cancelado");
    expect(resultado.possivelDuplicata).toBe(true);
  });

  it("NÃO trata um cancelado existente como duplicata de uma linha ativa (comportamento original preservado)", () => {
    const resultado = interpretarLinha({
      indice: 2,
      bruta: {
        Cliente: "Cliente Zeta",
        Descricao: "Nova venda",
        Categoria: "Vendas",
        Vencimento: "05/09/2026",
        Valor: "300,00",
        Status: "Previsto",
      },
      mapeamento: mapeamentoPadrao,
      tipoPlanilha: { modo: "fixo", tipo: "receber" },
      categorias: [{ id: "cat-vendas", nome: "Vendas", tipo: "receita" }],
      existentes: [
        { tipo: "receber", cliente_fornecedor: "Cliente Zeta", vencimento: "2026-09-05", valor: 300, status: "cancelado" },
      ],
    });
    expect(resultado.possivelDuplicata).toBe(false);
  });

  it("sem nenhum existente parecido, não marca duplicata", () => {
    expect(linhaZeta([]).possivelDuplicata).toBe(false);
  });
});

describe("interpretarLinha — regras de negócio", () => {
  const mapeamentoPadrao = {
    clienteFornecedor: "Cliente",
    descricao: "Descricao",
    categoria: "Categoria",
    vencimento: "Vencimento",
    valor: "Valor",
    status: "Status",
  };

  it("cliente ausente vira erro e a linha não fica pronta", () => {
    const resultado = interpretarLinha({
      indice: 2,
      bruta: { Cliente: "", Descricao: "x", Categoria: "", Vencimento: "01/09/2026", Valor: "10,00", Status: "" },
      mapeamento: mapeamentoPadrao,
      tipoPlanilha: { modo: "fixo", tipo: "receber" },
      categorias: [],
      existentes: [],
    });
    expect(resultado.pronta).toBe(false);
    expect(resultado.mensagens.some((m) => m.nivel === "erro")).toBe(true);
  });

  it('"Vencido" na planilha nunca é armazenado como status — vira "previsto"', () => {
    const resultado = interpretarLinha({
      indice: 2,
      bruta: { Cliente: "X", Descricao: "x", Categoria: "", Vencimento: "01/01/2020", Valor: "10,00", Status: "Vencido" },
      mapeamento: mapeamentoPadrao,
      tipoPlanilha: { modo: "fixo", tipo: "receber" },
      categorias: [],
      existentes: [],
    });
    expect(resultado.status).toBe("previsto");
  });

  it("categoria inexistente vira aviso (não erro) e não inventa categoria", () => {
    const resultado = interpretarLinha({
      indice: 2,
      bruta: { Cliente: "X", Descricao: "x", Categoria: "Não Existe", Vencimento: "01/09/2026", Valor: "10,00", Status: "" },
      mapeamento: mapeamentoPadrao,
      tipoPlanilha: { modo: "fixo", tipo: "receber" },
      categorias: [{ id: "c1", nome: "Vendas", tipo: "receita" }],
      existentes: [],
    });
    expect(resultado.categoriaId).toBeNull();
    expect(resultado.pronta).toBe(true);
    expect(resultado.mensagens.some((m) => m.nivel === "aviso")).toBe(true);
  });
});

describe("validarLinhaEstrutural — revalidação do servidor (regras de status por tipo)", () => {
  const base = {
    tipo: "receber" as const,
    clienteFornecedor: "Cliente X",
    descricao: "Venda",
    vencimento: "2026-09-01",
    valorCentavos: 1000,
    status: "previsto" as const,
  };

  it("aceita status válido para o tipo (receber: recebido)", () => {
    expect(validarLinhaEstrutural({ ...base, status: "recebido" })).toBeNull();
  });

  it('rejeita status "pago" para uma linha do tipo receber (vocabulário é por tipo)', () => {
    expect(validarLinhaEstrutural({ ...base, status: "pago" })).not.toBeNull();
  });

  it('rejeita status "recebido" para uma linha do tipo pagar', () => {
    expect(validarLinhaEstrutural({ ...base, tipo: "pagar", status: "recebido" })).not.toBeNull();
  });

  it("rejeita cliente/fornecedor vazio", () => {
    expect(validarLinhaEstrutural({ ...base, clienteFornecedor: "  " })).not.toBeNull();
  });

  it("rejeita valor zero ou negativo", () => {
    expect(validarLinhaEstrutural({ ...base, valorCentavos: 0 })).not.toBeNull();
  });

  it("rejeita vencimento fora do formato yyyy-mm-dd", () => {
    expect(validarLinhaEstrutural({ ...base, vencimento: "01/09/2026" })).not.toBeNull();
  });
});
