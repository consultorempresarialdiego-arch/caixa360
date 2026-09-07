import { RadarStatus } from "@/components/dashboard/RadarStatus";
import { MockupFrame } from "./MockupFrame";

const SINAIS = [
  "2 conta(s) a pagar vencida(s), totalizando R$ 1.200,00.",
  "Nos próximos 30 dias, os pagamentos previstos superam os recebimentos previstos.",
  '"Fornecedores" concentra 45% das despesas previstas no período.',
];

export function RadarSection() {
  return (
    <section className="bg-surface border-y border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="order-2 lg:order-1">
          <p className="text-xs font-medium tracking-wide text-brand-700 uppercase">Radar de Caixa</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-ink-900 text-balance">
            Seu caixa, classificado em um olhar.
          </h2>
          <p className="mt-4 text-ink-500">
            O Radar acompanha seu saldo projetado e classifica automaticamente entre{" "}
            <strong className="text-ink-700">saudável</strong>,{" "}
            <strong className="text-ink-700">atenção</strong>,{" "}
            <strong className="text-ink-700">risco</strong> e{" "}
            <strong className="text-ink-700">excesso de caixa</strong> — e ainda aponta sinais
            específicos, como contas vencidas ou uma categoria de despesa que está pesando mais
            que o normal.
          </p>
        </div>
        <div className="order-1 lg:order-2">
          <MockupFrame>
            <div className="space-y-3">
              <RadarStatus
                radar={{
                  status: "risco",
                  mensagem: "Seu caixa projetado fica negativo em R$ 850,00 daqui a 30 dias.",
                }}
              />
              <div className="card p-4 space-y-1.5">
                <p className="text-sm font-medium text-ink-700">Sinais do Radar</p>
                {SINAIS.map((s) => (
                  <p key={s} className="text-sm text-ink-700">
                    • {s}
                  </p>
                ))}
              </div>
            </div>
          </MockupFrame>
        </div>
      </div>
    </section>
  );
}
