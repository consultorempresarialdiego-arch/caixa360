"use client";

import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PontoFluxoCaixa } from "@/lib/radar";

function formatarDataCurta(dataISO: string): string {
  const [, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}`;
}

/**
 * Duas séries sobrepostas (saldoRealizado / saldoPrevisto), cada uma nula
 * fora do seu trecho — é assim que o recharts desenha um trecho sólido
 * (realizado) e outro tracejado (previsto) na mesma linha, com a quebra
 * visual exatamente em "hoje" (que entra nas duas séries, servindo de
 * ponto de conexão).
 */
export function GraficoFluxoCaixa({ pontos }: { pontos: PontoFluxoCaixa[] }) {
  const dados = pontos.map((p) => ({
    data: formatarDataCurta(p.data),
    saldoRealizado: p.momento !== "previsto" ? p.saldoAcumulado : undefined,
    saldoPrevisto: p.momento !== "realizado" ? p.saldoAcumulado : undefined,
  }));

  return (
    <div className="card p-4">
      <p className="text-sm font-medium text-ink-700 mb-1">Fluxo de Caixa — saldo acumulado</p>
      <div className="flex gap-4 text-xs text-ink-500 mb-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 bg-ink-900" /> Realizado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 border-t-2 border-dashed border-brand-700" /> Previsto
        </span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={dados} margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" />
          <XAxis dataKey="data" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis
            tick={{ fontSize: 12 }}
            width={72}
            tickFormatter={(v: number) => v.toLocaleString("pt-BR")}
          />
          <Tooltip
            formatter={(v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          />
          <ReferenceLine y={0} stroke="#DC2626" strokeDasharray="2 2" />
          <Line
            type="monotone"
            dataKey="saldoRealizado"
            stroke="#0F1729"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            name="Realizado"
          />
          <Line
            type="monotone"
            dataKey="saldoPrevisto"
            stroke="#0E7C86"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            connectNulls={false}
            name="Previsto"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
