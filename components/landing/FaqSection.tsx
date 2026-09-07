const PERGUNTAS = [
  {
    pergunta: "O CAIXA360 substitui minha planilha?",
    resposta:
      "Sim. Você pode continuar usando a planilha que já tem — o CAIXA360 importa os dados dela e assume o controle a partir daí.",
  },
  {
    pergunta: "Preciso entender de tecnologia para usar?",
    resposta:
      "Não. O começo é acompanhado: alguém da equipe ajuda a configurar sua conta e a importar seus dados durante a demonstração.",
  },
  {
    pergunta: "Meus dados ficam seguros e isolados dos de outras empresas?",
    resposta:
      "Sim. Cada empresa só acessa os próprios dados — o isolamento é garantido no próprio banco de dados, não só na tela.",
  },
  {
    pergunta: "Quanto custa?",
    resposta:
      "Os planos ainda estão sendo definidos. Durante o acesso antecipado, as condições são combinadas diretamente com cada empresa.",
  },
  {
    pergunta: "Como começo?",
    resposta:
      "Agende uma demonstração gratuita — a equipe mostra o CAIXA360 funcionando com um exemplo real e ajuda a configurar sua conta.",
  },
];

export function FaqSection() {
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h2 className="font-display text-2xl font-bold text-ink-900 text-center">
        Perguntas frequentes
      </h2>
      <div className="mt-8 space-y-3">
        {PERGUNTAS.map((item) => (
          <details key={item.pergunta} className="card p-4 group">
            <summary className="font-medium text-ink-900 cursor-pointer list-none flex items-center justify-between">
              {item.pergunta}
              <span className="text-ink-300 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
            </summary>
            <p className="mt-3 text-sm text-ink-500">{item.resposta}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
