"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PontoProjecao } from "@/lib/radar";

interface GraficoProjecaoProps {
  projecoes: PontoProjecao[];
  caixaMinimo: number | null;
}

export function GraficoProjecao({ projecoes, caixaMinimo }: GraficoProjecaoProps) {
  const dados = projecoes.map((p) => ({ dias: `${p.dias}d`, saldo: p.saldoProjetado }));

  return (
    <div className="card p-4">
      <p className="text-sm font-medium text-ink-700 mb-3">
        Sua projeção de caixa (7/15/30/60/90 dias)
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={dados} margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" />
          <XAxis dataKey="dias" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            width={72}
            tickFormatter={(v: number) => v.toLocaleString("pt-BR")}
          />
          <Tooltip
            formatter={(v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          />
          {caixaMinimo !== null && (
            <ReferenceLine
              y={caixaMinimo}
              stroke="#D97706"
              strokeDasharray="4 4"
              label={{ value: "Caixa mínimo", fontSize: 11, fill: "#D97706", position: "insideTopLeft" }}
            />
          )}
          <ReferenceLine y={0} stroke="#DC2626" strokeDasharray="2 2" />
          <Line type="monotone" dataKey="saldo" stroke="#0E7C86" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
