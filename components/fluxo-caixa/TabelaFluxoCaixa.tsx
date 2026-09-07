import { cn, formatarMoeda } from "@/lib/utils";
import type { MomentoFluxo, PontoFluxoCaixa } from "@/lib/radar";

function formatarData(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

const RESUMO_MOMENTO: Record<MomentoFluxo, { label: string; classe: string }> = {
  realizado: { label: "Realizado", classe: "bg-canvas text-ink-700 border border-border" },
  hoje: { label: "Hoje", classe: "bg-brand-700 text-white" },
  previsto: { label: "Previsto", classe: "bg-brand-200 text-brand-900" },
};

export function TabelaFluxoCaixa({ pontos }: { pontos: PontoFluxoCaixa[] }) {
  return (
    <div className="card overflow-x-auto max-h-[420px] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface">
          <tr className="border-b border-border text-left text-ink-500">
            <th className="px-4 py-2 font-medium">Data</th>
            <th className="px-4 py-2 font-medium">Situação</th>
            <th className="px-4 py-2 font-medium text-right">Entradas</th>
            <th className="px-4 py-2 font-medium text-right">Saídas</th>
            <th className="px-4 py-2 font-medium text-right">Saldo do dia</th>
            <th className="px-4 py-2 font-medium text-right">Saldo acumulado</th>
          </tr>
        </thead>
        <tbody>
          {pontos.map((p) => {
            const resumo = RESUMO_MOMENTO[p.momento];
            return (
              <tr
                key={p.data}
                className={cn(
                  "border-b border-border last:border-0",
                  p.momento === "hoje" && "bg-brand-200/20"
                )}
              >
                <td className="px-4 py-2 text-ink-900">{formatarData(p.data)}</td>
                <td className="px-4 py-2">
                  <span className={cn("inline-block rounded-sm px-2 py-0.5 text-xs font-medium", resumo.classe)}>
                    {resumo.label}
                  </span>
                  {p.temVencido && (
                    <span className="ml-1 inline-block rounded-sm px-2 py-0.5 text-xs font-medium bg-red-50 text-radar-risco">
                      Vencido
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-right valor text-radar-saudavel">
                  {p.entradas > 0 ? formatarMoeda(p.entradas) : "—"}
                  {p.entradasPrevistas > 0 && (
                    <span className="block text-xs text-ink-500 font-normal">
                      + {formatarMoeda(p.entradasPrevistas)} previsto
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-right valor text-radar-risco">
                  {p.saidas > 0 ? formatarMoeda(p.saidas) : "—"}
                  {p.saidasPrevistas > 0 && (
                    <span className="block text-xs text-ink-500 font-normal">
                      + {formatarMoeda(p.saidasPrevistas)} previsto
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-right valor text-ink-700">{formatarMoeda(p.saldoDia)}</td>
                <td className="px-4 py-2 text-right valor font-medium text-ink-900">
                  {formatarMoeda(p.saldoAcumulado)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
