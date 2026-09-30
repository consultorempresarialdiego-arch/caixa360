import type { StatusAssinatura } from "@/lib/assinatura";

const APRESENTACAO: Record<StatusAssinatura, { titulo: string; texto: string }> = {
  pendente: {
    titulo: "Aguardando confirmação de pagamento",
    texto:
      "Ainda não identificamos a confirmação do seu pagamento. Seu acesso continua liberado enquanto isso é confirmado — se você já pagou, entre em contato para agilizarmos.",
  },
  acesso_antecipado: {
    titulo: "Você está no acesso antecipado",
    texto:
      "Estamos selecionando as primeiras empresas para utilizar o CAIXA360, acompanhar de perto a experiência e ajudar a construir uma nova forma de administrar a previsibilidade do caixa.",
  },
  ativa: {
    titulo: "Acesso ativo",
    texto: "Sua conta está ativa e em uso normal.",
  },
  pausada: {
    titulo: "Acesso pausado",
    texto: "Seu acesso está temporariamente pausado.",
  },
  cancelada: {
    titulo: "Acesso encerrado",
    texto: "Seu acesso ao CAIXA360 foi encerrado.",
  },
};

export function AbaPlano({ status }: { status: StatusAssinatura | null }) {
  const apresentacao = status ? APRESENTACAO[status] : null;

  return (
    <div className="card p-6 max-w-lg space-y-2">
      <p className="text-sm font-medium text-ink-700">Plano atual</p>
      <p className="text-lg font-semibold text-ink-900">
        {apresentacao?.titulo ?? "Status indisponível"}
      </p>
      <p className="text-sm text-ink-500">
        {apresentacao?.texto ?? "Não foi possível identificar o status da sua conta agora."}
      </p>
    </div>
  );
}
