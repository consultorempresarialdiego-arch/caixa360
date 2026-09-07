import { cn } from "@/lib/utils";
import type { ClassificacaoRadar, StatusRadar } from "@/lib/radar";

const ESTILOS: Record<StatusRadar, string> = {
  saudavel: "bg-emerald-50 border-emerald-200 text-radar-saudavel",
  atencao: "bg-amber-50 border-amber-200 text-radar-atencao",
  risco: "bg-red-50 border-red-200 text-radar-risco",
  excesso: "bg-blue-50 border-blue-200 text-radar-excesso",
  neutro: "bg-canvas border-border text-ink-500",
};

const TITULOS: Record<StatusRadar, string> = {
  saudavel: "Caixa saudável",
  atencao: "Atenção",
  risco: "Risco de caixa",
  excesso: "Excesso de caixa",
  neutro: "Radar desativado",
};

export function RadarStatus({ radar }: { radar: ClassificacaoRadar }) {
  return (
    <div className={cn("rounded-md border p-5", ESTILOS[radar.status])}>
      <p className="text-sm font-semibold">{TITULOS[radar.status]}</p>
      <p className="text-sm mt-1">{radar.mensagem}</p>
    </div>
  );
}
