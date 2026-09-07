import { MockupFrame } from "./MockupFrame";

const LINHAS = [
  { cliente: "Cliente ACME Ltda", valor: "R$ 1.500,00", status: "Pronta", tom: "ok" as const },
  { cliente: "Cliente Beta ME", valor: "R$ 2.300,50", status: "Possível duplicata", tom: "aviso" as const },
  { cliente: "—", valor: "R$ 500,00", status: "Cliente ausente", tom: "erro" as const },
];

const CLASSES = {
  ok: "bg-emerald-50 text-radar-saudavel",
  aviso: "bg-amber-50 text-radar-atencao",
  erro: "bg-red-50 text-radar-risco",
};

export function ImportacaoSection() {
  return (
    <section className="bg-surface border-y border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-xs font-medium tracking-wide text-brand-700 uppercase">Importação Excel/CSV</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-ink-900 text-balance">
            Traga a planilha que você já usa.
          </h2>
          <p className="mt-4 text-ink-500">
            Sem digitar tudo de novo — o CAIXA360 lê sua planilha .xlsx ou .csv, reconhece as
            colunas sozinho e avisa antes de importar qualquer coisa duvidosa: valor quebrado,
            cliente ausente ou uma possível duplicidade.
          </p>
        </div>
        <MockupFrame>
          <div className="space-y-2">
            {LINHAS.map((l) => (
              <div
                key={l.cliente + l.status}
                className="flex items-center justify-between gap-3 text-sm border-b border-border last:border-0 pb-2 last:pb-0"
              >
                <span className="text-ink-900 truncate">{l.cliente}</span>
                <span className="valor text-ink-700 shrink-0">{l.valor}</span>
                <span
                  className={`shrink-0 rounded-sm px-2 py-0.5 text-xs font-medium ${CLASSES[l.tom]}`}
                >
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        </MockupFrame>
      </div>
    </section>
  );
}
