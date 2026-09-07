/**
 * Elemento de assinatura visual das telas de autenticação: uma varredura de
 * radar sutil, em baixa opacidade, alinhada ao conceito central do produto
 * (Radar de Caixa). Puramente decorativo — sem impacto em performance ou
 * acessibilidade (aria-hidden).
 */
export function RadarBackground() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]"
      viewBox="0 0 800 800"
    >
      <circle cx="400" cy="400" r="120" fill="none" stroke="#14A6A6" strokeWidth="1" />
      <circle cx="400" cy="400" r="220" fill="none" stroke="#14A6A6" strokeWidth="1" />
      <circle cx="400" cy="400" r="320" fill="none" stroke="#14A6A6" strokeWidth="1" />
      <line x1="400" y1="0" x2="400" y2="800" stroke="#14A6A6" strokeWidth="1" />
      <line x1="0" y1="400" x2="800" y2="400" stroke="#14A6A6" strokeWidth="1" />
    </svg>
  );
}
