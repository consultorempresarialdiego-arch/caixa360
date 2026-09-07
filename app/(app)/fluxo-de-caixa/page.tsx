import Link from "next/link";
import { montarFluxoCaixa, PERIODOS_FLUXO_CAIXA, type PeriodoFluxoCaixa } from "@/lib/fluxo-caixa";
import { SeletorPeriodoFluxo } from "@/components/fluxo-caixa/SeletorPeriodoFluxo";
import { GraficoFluxoCaixa } from "@/components/fluxo-caixa/GraficoFluxoCaixa";
import { TabelaFluxoCaixa } from "@/components/fluxo-caixa/TabelaFluxoCaixa";

function resolverPeriodo(valor: string | undefined): PeriodoFluxoCaixa {
  const encontrado = PERIODOS_FLUXO_CAIXA.find((o) => o.valor === valor);
  return encontrado ? encontrado.valor : "30";
}

export default async function Pagina({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo } = await searchParams;
  const periodoAtual = resolverPeriodo(periodo);
  const dados = await montarFluxoCaixa(periodoAtual);

  if (!dados.temEmpresa) {
    return <p className="text-sm text-ink-500">Nenhuma empresa encontrada.</p>;
  }

  if (!dados.temLancamentos) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-ink-900">Fluxo de Caixa</h1>
        <div className="card p-8 text-center space-y-3">
          <p className="text-sm text-ink-700">Nenhum lançamento cadastrado ainda.</p>
          <p className="text-sm text-ink-500">
            Cadastre suas contas para ver o fluxo de caixa dia a dia.
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Fluxo de Caixa</h1>
          <p className="text-sm text-ink-500">{dados.empresaNome}</p>
        </div>
        <SeletorPeriodoFluxo atual={periodoAtual} />
      </div>

      <GraficoFluxoCaixa pontos={dados.pontos} />
      <TabelaFluxoCaixa pontos={dados.pontos} />
    </div>
  );
}
