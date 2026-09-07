import { RadarStatus } from "@/components/dashboard/RadarStatus";
import { CardResumo } from "@/components/dashboard/CardResumo";
import { MockupFrame } from "./MockupFrame";
import { linkWhatsApp, MENSAGEM_DEMONSTRACAO, MENSAGEM_GERAL } from "@/lib/contato";

export function HeroSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-ink-900 leading-tight text-balance">
          Saiba quanto dinheiro sua empresa terá antes que o problema aconteça.
        </h1>
        <p className="mt-5 text-lg text-ink-500 max-w-xl">
          O CAIXA360 transforma contas a pagar e receber em uma visão clara do seu caixa atual e
          da sua projeção financeira.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
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

      <MockupFrame>
        <div className="space-y-4">
          <RadarStatus
            radar={{
              status: "saudavel",
              mensagem: "Seu caixa está saudável nos próximos 30 dias.",
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <CardResumo titulo="Saldo atual" valor="R$ 52.300,50" />
            <CardResumo titulo="A receber (30d)" valor="R$ 12.400,00" tom="positivo" />
            <CardResumo titulo="A pagar (30d)" valor="R$ 6.100,00" tom="negativo" />
            <CardResumo titulo="Resultado previsto" valor="R$ 6.300,00" tom="positivo" />
          </div>
        </div>
      </MockupFrame>
    </section>
  );
}
