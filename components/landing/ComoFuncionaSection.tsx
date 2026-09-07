const PASSOS = [
  {
    titulo: "Importe ou cadastre suas contas",
    texto: "Traga a planilha que você já usa, ou cadastre suas contas a pagar e receber diretamente.",
  },
  {
    titulo: "O Radar calcula tudo sozinho",
    texto: "Saldo real e projeção dos próximos dias, calculados automaticamente a partir dos seus dados.",
  },
  {
    titulo: "Você age com antecedência",
    texto: "Um alerta claro antes do caixa apertar — com tempo de negociar, cobrar ou ajustar.",
  },
];

export function ComoFuncionaSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <h2 className="font-display text-2xl font-bold text-ink-900 text-center">
        Como funciona
      </h2>
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {PASSOS.map((passo, i) => (
          <div key={passo.titulo} className="card p-6">
            <span className="font-display text-2xl font-bold text-brand-700">{i + 1}</span>
            <h3 className="mt-3 font-semibold text-ink-900">{passo.titulo}</h3>
            <p className="mt-2 text-sm text-ink-500">{passo.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
