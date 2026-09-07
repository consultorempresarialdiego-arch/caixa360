import { cn } from "@/lib/utils";
import { RadarStatus } from "./RadarStatus";
import type { ClassificacaoRadar, PontoDeAtencao, Sinal } from "@/lib/radar";

interface PainelRadarProps {
  radar: ClassificacaoRadar;
  pontoDeAtencao: PontoDeAtencao;
  sinais: Sinal[];
}

/**
 * Fase 10.5 — funde visualmente Radar + Ponto de Atenção + Sinais num único
 * bloco (o "protagonista" da tela). Não recalcula nada: só compõe dados que
 * já vêm prontos de lib/radar.ts. RadarStatus continua intocado (também é
 * usado no mockup da Landing Page).
 */
export function PainelRadar({ radar, pontoDeAtencao, sinais }: PainelRadarProps) {
  return (
    <div>
      <RadarStatus radar={radar} />
      <div className="card rounded-t-none border-t-0 -mt-px p-5 space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
            Próximo ponto de atenção
          </p>
          <p
            className={cn(
              "text-sm mt-1",
              pontoDeAtencao.emRisco ? "text-radar-risco font-medium" : "text-ink-700"
            )}
          >
            {pontoDeAtencao.mensagem}
          </p>
        </div>

        {sinais.length > 0 && (
          <div className="pt-3 border-t border-border space-y-1">
            <p className="text-sm font-medium text-ink-700">Sinais do Radar</p>
            {sinais.map((s) => (
              <p key={s.id} className="text-sm text-ink-700">
                • {s.mensagem}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
