import { linkWhatsApp, MENSAGEM_GERAL } from "@/lib/contato";

/** Link discreto de suporte via WhatsApp (Fase 10.2 — reforça a venda assistida
 * nas telas de Cadastro, Login e Onboarding). Número centralizado em lib/contato.ts. */
export function AjudaWhatsApp() {
  return (
    <p className="text-center text-sm text-ink-500">
      Precisa de ajuda para começar?{" "}
      <a
        href={linkWhatsApp(MENSAGEM_GERAL)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-700 hover:underline"
      >
        Fale com a gente
      </a>
    </p>
  );
}
