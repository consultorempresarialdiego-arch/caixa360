import { LandingHeader } from "./LandingHeader";
import { HeroSection } from "./HeroSection";
import { ProblemaSolucaoSection } from "./ProblemaSolucaoSection";
import { ComoFuncionaSection } from "./ComoFuncionaSection";
import { RadarSection } from "./RadarSection";
import { FluxoCaixaSection } from "./FluxoCaixaSection";
import { ImportacaoSection } from "./ImportacaoSection";
import { DiferenciaisSection } from "./DiferenciaisSection";
import { AcessoAntecipadoSection } from "./AcessoAntecipadoSection";
import { FaqSection } from "./FaqSection";
import { CtaFinalSection } from "./CtaFinalSection";
import { LandingFooter } from "./LandingFooter";

/**
 * Landing comercial do CAIXA360 (Fase 10.1). Modelo de aquisição é venda
 * assistida — todos os CTAs levam ao WhatsApp comercial (lib/contato.ts),
 * nunca a um fluxo de autocadastro. Ordem das seções segue exatamente o
 * documento estratégico aprovado: problema → solução → como funciona →
 * Radar → Fluxo de Caixa → Importação → diferenciais → acesso antecipado →
 * FAQ → CTA final.
 */
export function LandingPage() {
  return (
    <div className="bg-canvas">
      <LandingHeader />
      <main>
        <HeroSection />
        <ProblemaSolucaoSection />
        <ComoFuncionaSection />
        <RadarSection />
        <FluxoCaixaSection />
        <ImportacaoSection />
        <DiferenciaisSection />
        <AcessoAntecipadoSection />
        <FaqSection />
        <CtaFinalSection />
      </main>
      <LandingFooter />
    </div>
  );
}
