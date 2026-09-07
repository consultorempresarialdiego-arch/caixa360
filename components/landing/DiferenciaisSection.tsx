const ITENS = [
  {
    titulo: "Radar de Caixa",
    texto: "Classifica sua saúde financeira automaticamente e avisa antes do problema, não depois.",
  },
  {
    titulo: "Rigor de verdade",
    texto: "Separa o que já aconteceu do que é só previsão — nenhum número otimista se disfarça de saldo real.",
  },
  {
    titulo: "Sem recomeçar do zero",
    texto: "Importe a planilha que você já usa; o sistema reconhece as colunas e os dados sozinho.",
  },
];

export function DiferenciaisSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <h2 className="font-display text-2xl font-bold text-ink-900 text-center text-balance">
        Por que o Caixa360 é diferente
      </h2>
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {ITENS.map((item) => (
          <div key={item.titulo} className="text-center px-2">
            <h3 className="font-semibold text-ink-900">{item.titulo}</h3>
            <p className="mt-2 text-sm text-ink-500">{item.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
