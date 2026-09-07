import Link from "next/link";
import { montarDashboard, PERIODOS_DASHBOARD, PERIODO_PADRAO, type PeriodoDashboard } from "@/lib/dashboard";
import { encontrarPontoDeAtencao } from "@/lib/radar";
import { formatarMoeda } from "@/lib/utils";
import { SaldoHero } from "@/components/dashboard/SaldoHero";
import { PainelRadar } from "@/components/dashboard/PainelRadar";
import { CardResumo } from "@/components/dashboard/CardResumo";
import { GraficoProjecao } from "@/components/dashboard/GraficoProjecao";
import { SeletorPeriodo } from "@/components/dashboard/SeletorPeriodo";

function resolverPeriodo(valor: string | undefined): PeriodoDashboard {
  const numero = Number(valor);
  return (PERIODOS_DASHBOARD as number[]).includes(numero)
    ? (numero as PeriodoDashboard)
    : PERIODO_PADRAO;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo } = await searchParams;
  const periodoDias = resolverPeriodo(periodo);
  const dados = await montarDashboard(periodoDias);

  if (!dados.temEmpresa) {
    return <p className="text-sm text-ink-500">Nenhuma empresa encontrada.</p>;
  }

  if (!dados.temLancamentos) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-ink-900">Dashboard</h1>
        <div className="card p-8 text-center space-y-3">
          <p className="text-sm text-ink-700">
            Nenhum dado cadastrado ainda — sem lançamentos, o Radar de Caixa não tem o que calcular.
          </p>
          <p className="text-sm text-ink-500">
            Cadastre sua primeira conta ou importe uma planilha para ver seu Radar de Caixa.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link href="/contas-a-receber/novo" className="btn-primary">
              Nova conta a receber
            </Link>
            <Link href="/contas-a-pagar/novo" className="btn-secondary">
              Nova conta a pagar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pontoDeAtencao = encontrarPontoDeAtencao(dados.projecoes, dados.caixaMinimo);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Dashboard</h1>
          <p className="text-sm text-ink-500">{dados.empresaNome}</p>
        </div>
        <SeletorPeriodo atual={periodoDias} />
      </div>

      {(!dados.temContasReceber || !dados.temContasPagar) && (
        <p className="text-sm text-radar-atencao bg-amber-50 border border-amber-200 rounded-sm px-3 py-2">
          {!dados.temContasReceber && "Você ainda não cadastrou contas a receber. "}
          {!dados.temContasPagar && "Você ainda não cadastrou contas a pagar. "}
          Sua projeção pode estar incompleta.
        </p>
      )}

      {/* 1. "Quanto tenho hoje?" — hero isolado, sem competir com mais nada. */}
      <SaldoHero saldoAtual={dados.saldoAtual} />

      {/* 2. "Por que isso vai acontecer?" / "Quando meu caixa pode apertar?" —
         Radar + ponto de atenção + sinais, como um bloco só. */}
      <PainelRadar radar={dados.radar} pontoDeAtencao={pontoDeAtencao} sinais={dados.sinais} />

      <div className="flex items-center justify-between text-sm text-ink-500 -mt-2">
        <span>
          Caixa mínimo:{" "}
          {dados.caixaMinimo === null ? "não definido" : formatarMoeda(dados.caixaMinimo)}
        </span>
        <Link href="/configuracoes?aba=caixa-minimo" className="text-brand-700 hover:underline">
          {dados.caixaMinimo === null ? "Definir agora" : "Alterar"}
        </Link>
      </div>

      {/* 3. "O que vai acontecer com esse dinheiro?" — a prova visual do Radar. */}
      <GraficoProjecao projecoes={dados.projecoes} caixaMinimo={dados.caixaMinimo} />

      {/* 4. "Quais entradas e saídas estão causando isso?" */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-ink-700">Próximas movimentações ({periodoDias}d)</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CardResumo
            titulo="Entradas previstas"
            valor={formatarMoeda(dados.totalReceberPrevisto)}
            tom="positivo"
          />
          <CardResumo
            titulo="Saídas previstas"
            valor={formatarMoeda(dados.totalPagarPrevisto)}
            tom="negativo"
          />
          <CardResumo
            titulo="Resultado previsto"
            valor={formatarMoeda(dados.resultadoPrevisto)}
            tom={dados.resultadoPrevisto >= 0 ? "positivo" : "negativo"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="card p-4 space-y-2">
          <p className="text-sm font-medium text-ink-700">Contas vencidas</p>
          <div className="flex justify-between text-sm">
            <span className="text-ink-500">A pagar</span>
            <span className="valor text-radar-risco">
              {dados.vencidas.pagar.quantidade} · {formatarMoeda(dados.vencidas.pagar.valor)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-500">A receber</span>
            <span className="valor text-radar-risco">
              {dados.vencidas.receber.quantidade} · {formatarMoeda(dados.vencidas.receber.valor)}
            </span>
          </div>
          {(dados.vencidas.pagar.quantidade > 0 || dados.vencidas.receber.quantidade > 0) && (
            <div className="flex gap-3 pt-1 text-sm">
              <Link href="/contas-a-pagar?status=vencido" className="text-brand-700 hover:underline">
                Ver a pagar
              </Link>
              <Link href="/contas-a-receber?status=vencido" className="text-brand-700 hover:underline">
                Ver a receber
              </Link>
            </div>
          )}
        </div>

        <div className="card p-4 space-y-2">
          <p className="text-sm font-medium text-ink-700">
            Maiores categorias de despesa ({periodoDias}d)
          </p>
          {dados.topCategoriasDespesa.length === 0 ? (
            <p className="text-sm text-ink-500">Sem despesas previstas no período.</p>
          ) : (
            dados.topCategoriasDespesa.map((c) => (
              <div key={c.nome} className="flex justify-between text-sm">
                <span className="text-ink-700">{c.nome}</span>
                <span className="valor text-ink-900">{formatarMoeda(c.valor)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/contas-a-receber/novo" className="btn-primary">
          Nova conta a receber
        </Link>
        <Link href="/contas-a-pagar/novo" className="btn-secondary">
          Nova conta a pagar
        </Link>
      </div>
    </div>
  );
}
