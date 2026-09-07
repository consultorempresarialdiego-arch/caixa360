import { MockupFrame } from "./MockupFrame";

/**
 * Mockup leve em SVG puro (sem Recharts) — a landing pública não precisa
 * carregar a biblioteca de gráficos só para uma ilustração; o padrão visual
 * (sólido até hoje, tracejado depois) é o mesmo do gráfico real.
 */
function GraficoMockup() {
  return (
    <svg viewBox="0 0 320 140" className="w-full h-auto" role="img" aria-label="Gráfico de saldo acumulado: realizado sólido até hoje, projeção tracejada depois">
      <line x1="0" y1="120" x2="320" y2="120" stroke="#E4E7EC" strokeWidth="1" />
      <line x1="0" y1="80" x2="320" y2="80" stroke="#E4E7EC" strokeWidth="1" />
      <line x1="0" y1="40" x2="320" y2="40" stroke="#E4E7EC" strokeWidth="1" />
      <polyline
        points="0,100 50,98 100,95 150,90 190,78"
        fill="none"
        stroke="#0F1729"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <polyline
        points="190,78 230,60 270,45 320,20"
        fill="none"
        stroke="#0E7C86"
        strokeWidth="3"
        strokeDasharray="7 5"
        strokeLinecap="round"
      />
      <circle cx="190" cy="78" r="4" fill="#0E7C86" />
      <text x="190" y="132" textAnchor="middle" fontSize="11" fill="#5B6B87">Hoje</text>
    </svg>
  );
}

export function FluxoCaixaSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
      <MockupFrame>
        <GraficoMockup />
        <div className="flex gap-4 text-xs text-ink-500 mt-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 bg-ink-900" /> Realizado
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 border-t-2 border-dashed border-brand-700" /> Previsto
          </span>
        </div>
      </MockupFrame>
      <div>
        <p className="text-xs font-medium tracking-wide text-brand-700 uppercase">Fluxo de Caixa</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-ink-900 text-balance">
          O que já aconteceu. O que ainda vai acontecer. Sem misturar os dois.
        </h2>
        <p className="mt-4 text-ink-500">
          O gráfico mostra o realizado em linha sólida e a projeção em linha tracejada — nunca uma
          conta prevista entra disfarçada de dinheiro que já está no caixa. Um recebimento previsto
          para hoje só entra na conta quando ele realmente acontece.
        </p>
      </div>
    </section>
  );
}
