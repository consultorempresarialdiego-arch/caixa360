import Link from "next/link";
import { cn } from "@/lib/utils";
import { PERIODOS_DASHBOARD, type PeriodoDashboard } from "@/lib/dashboard";

export function SeletorPeriodo({ atual }: { atual: PeriodoDashboard }) {
  return (
    <div className="flex flex-wrap gap-1">
      {PERIODOS_DASHBOARD.map((dias) => (
        <Link
          key={dias}
          href={`/dashboard?periodo=${dias}`}
          className={cn(
            "rounded-sm px-3 py-1.5 text-sm transition-colors",
            atual === dias
              ? "bg-brand-700 text-white"
              : "bg-surface border border-border text-ink-700 hover:bg-canvas"
          )}
        >
          {dias} dias
        </Link>
      ))}
    </div>
  );
}
