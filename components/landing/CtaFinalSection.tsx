import { linkWhatsApp, MENSAGEM_DEMONSTRACAO, MENSAGEM_GERAL } from "@/lib/contato";

export function CtaFinalSection() {
  return (
    <section className="bg-brand-200/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 text-balance">
          Pronto para saber quanto dinheiro sua empresa vai ter?
        </h2>
        <p className="mt-3 text-ink-500">
          Agende uma demonstração gratuita e veja o CAIXA360 funcionando com um exemplo real.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={linkWhatsApp(MENSAGEM_DEMONSTRACAO)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary justify-center text-base px-6 py-3"
          >
            Agendar uma demonstração gratuita
          </a>
          <a
            href={linkWhatsApp(MENSAGEM_GERAL)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary justify-center text-base px-6 py-3"
          >
            Falar agora no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
