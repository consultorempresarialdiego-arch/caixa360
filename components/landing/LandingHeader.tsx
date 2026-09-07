import Link from "next/link";
import { linkWhatsApp, MENSAGEM_DEMONSTRACAO } from "@/lib/contato";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <span className="font-display text-xl font-bold text-ink-900">Caixa360</span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline text-sm text-ink-500 hover:text-ink-900 transition-colors"
          >
            Entrar
          </Link>
          <a
            href={linkWhatsApp(MENSAGEM_DEMONSTRACAO)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm"
          >
            Agendar demonstração
          </a>
        </div>
      </div>
    </header>
  );
}
