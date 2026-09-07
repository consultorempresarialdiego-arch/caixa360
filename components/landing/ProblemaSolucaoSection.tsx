export function ProblemaSolucaoSection() {
  return (
    <section className="bg-surface border-y border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <p className="text-xs font-medium tracking-wide text-radar-risco uppercase">O problema</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-ink-900 text-balance">
            Você só descobre que vai faltar dinheiro quando já é tarde para agir.
          </h2>
          <p className="mt-4 text-ink-500">
            O controle financeiro vive espalhado entre planilhas, extratos e memória. A pergunta
            mais simples de todas — <span className="text-ink-700">&ldquo;quanto dinheiro eu vou ter
            daqui a 30 dias?&rdquo;</span> — quase nunca tem uma resposta confiável.
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-brand-700 uppercase">Como o Caixa360 resolve</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-ink-900 text-balance">
            Uma visão clara do seu caixa hoje — e do que vem pela frente.
          </h2>
          <p className="mt-4 text-ink-500">
            O CAIXA360 junta suas contas a pagar e a receber num só lugar, calcula seu saldo real
            (não uma estimativa) e projeta os próximos dias com base no que já está previsto —
            mostrando com antecedência se o seu caixa vai ficar apertado, e quando.
          </p>
        </div>
      </div>
    </section>
  );
}
