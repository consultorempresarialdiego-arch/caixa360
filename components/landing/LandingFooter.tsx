import { linkWhatsApp, MENSAGEM_GERAL } from "@/lib/contato";

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-display font-bold text-ink-900">Caixa360</span>
        <p className="text-sm text-ink-500 text-center">
          Previsibilidade de caixa para pequenas e médias empresas.
        </p>
        <a
          href={linkWhatsApp(MENSAGEM_GERAL)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-brand-700 hover:underline"
        >
          Falar no WhatsApp
        </a>
      </div>
    </footer>
  );
}
