import Link from "next/link";
import { cn } from "@/lib/utils";
import { PERIODOS_FLUXO_CAIXA, type PeriodoFluxoCaixa } from "@/lib/fluxo-caixa";

export function SeletorPeriodoFluxo({ atual }: { atual: PeriodoFluxoCaixa }) {
  return (
    <div className="flex flex-wrap gap-1">
      {PERIODOS_FLUXO_CAIXA.map((opcao) => (
        <Link
          key={opcao.valor}
          href={`/fluxo-de-caixa?periodo=${opcao.valor}`}
          className={cn(
            "rounded-sm px-3 py-1.5 text-sm transition-colors",
            atual === opcao.valor
              ? "bg-brand-700 text-white"
              : "bg-surface border border-border text-ink-700 hover:bg-canvas"
          )}
        >
          {opcao.label}
        </Link>
      ))}
    </div>
  );
}
