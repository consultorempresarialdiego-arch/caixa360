import { formatarMoeda } from "@/lib/utils";

/** Fase 10.5 — "Seu caixa hoje" como hero visual da página, isolado dos
 * demais números para responder "quanto tenho hoje?" em menos de 1 segundo. */
export function SaldoHero({ saldoAtual }: { saldoAtual: number }) {
  return (
    <div className="card p-6 sm:p-8">
      <p className="text-sm text-ink-500">Seu caixa hoje</p>
      <p className="mt-1 font-display text-4xl sm:text-5xl font-bold text-ink-900 valor">
        {formatarMoeda(saldoAtual)}
      </p>
      <p className="mt-2 text-sm text-ink-500">Só o que já entrou ou saiu de verdade.</p>
    </div>
  );
}
