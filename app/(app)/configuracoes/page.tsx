import { redirect } from "next/navigation";
import { obterEmpresaAtual } from "@/lib/empresa";
import { createClient } from "@/lib/supabase/server";
import { calcularSaldoNaData, type LancamentoParaCalculo } from "@/lib/radar";
import { adicionarDias, hojeISO } from "@/lib/utils";
import { logErro } from "@/lib/log";
import { NavegacaoAbas, ABAS_CONFIGURACOES, type AbaConfiguracoes } from "@/components/configuracoes/NavegacaoAbas";
import { AbaDadosEmpresa } from "@/components/configuracoes/AbaDadosEmpresa";
import { AbaCaixaMinimo } from "@/components/configuracoes/AbaCaixaMinimo";
import { AbaCategorias, type CategoriaExibicao } from "@/components/configuracoes/AbaCategorias";
import { AbaPlano } from "@/components/configuracoes/AbaPlano";
import { obterStatusAssinatura } from "@/lib/assinatura";

function resolverAba(valor: string | undefined): AbaConfiguracoes {
  return (ABAS_CONFIGURACOES as string[]).includes(valor ?? "") ? (valor as AbaConfiguracoes) : "empresa";
}

function centavos(valorReais: number | null): number {
  return valorReais === null ? 0 : Math.round(valorReais * 100);
}

export default async function Pagina({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const { aba } = await searchParams;
  const abaAtual = resolverAba(aba);

  const empresa = await obterEmpresaAtual();
  if (!empresa) redirect("/onboarding");

  const supabase = await createClient();
  const caixaMinimoCentavos = centavos(empresa.caixaMinimo);

  let conteudo: React.ReactNode;

  if (abaAtual === "empresa") {
    const { data: lancamentosData, error: erroLancamentos } = await supabase
      .from("lancamentos")
      .select("tipo, status, vencimento, valor, categoria_id, data_pagamento_recebimento")
      .eq("empresa_id", empresa.id)
      .neq("status", "cancelado");

    if (erroLancamentos) {
      logErro("configuracoes.page.empresa", erroLancamentos, { empresaId: empresa.id });
      throw new Error("Não foi possível carregar os dados da empresa. Tente novamente.");
    }

    const lancamentos: LancamentoParaCalculo[] = lancamentosData ?? [];
    // Mesma função e mesma semântica do Dashboard e do Fluxo de Caixa —
    // nunca uma conta própria desta tela.
    const saldoAtualDinamico = calcularSaldoNaData(empresa.saldoAtual, lancamentos, adicionarDias(hojeISO(), 1));

    conteudo = (
      <AbaDadosEmpresa
        nomeAtual={empresa.nome}
        setorAtual={empresa.setor ?? ""}
        saldoAtualDinamico={saldoAtualDinamico}
      />
    );
  } else if (abaAtual === "caixa-minimo") {
    conteudo = <AbaCaixaMinimo caixaMinimoCentavosInicial={caixaMinimoCentavos} />;
  } else if (abaAtual === "categorias") {
    const { data: categoriasData, error: erroCategorias } = await supabase
      .from("categorias")
      .select("id, nome, tipo, empresa_id")
      .order("nome", { ascending: true });

    if (erroCategorias) {
      logErro("configuracoes.page.categorias", erroCategorias, { empresaId: empresa.id });
      throw new Error("Não foi possível carregar as categorias. Tente novamente.");
    }

    const categorias: CategoriaExibicao[] = (categoriasData ?? []).map((c) => ({
      id: c.id,
      nome: c.nome,
      tipo: c.tipo,
      empresaId: c.empresa_id,
    }));

    conteudo = <AbaCategorias categorias={categorias} />;
  } else {
    const status = await obterStatusAssinatura(empresa.id);
    conteudo = <AbaPlano status={status} />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink-900">Configurações</h1>
      <NavegacaoAbas atual={abaAtual} />
      {conteudo}
    </div>
  );
}
