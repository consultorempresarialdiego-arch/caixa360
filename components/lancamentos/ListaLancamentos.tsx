import Link from "next/link";
import { cn } from "@/lib/utils";
import { ehVencido, type Lancamento, type PeriodoFiltro, type StatusFiltro } from "@/lib/lancamentos";
import {
  concluirLancamento,
  cancelarLancamento,
  reverterLancamento,
  type TipoLancamento,
} from "@/lib/actions/lancamentos";

type Categoria = { id: string; nome: string };

interface ListaLancamentosProps {
  tipo: TipoLancamento;
  baseHref: string;
  lancamentos: Lancamento[];
  categorias: Categoria[];
  statusAtual: StatusFiltro;
  periodoAtual: PeriodoFiltro;
}

const OPCOES_STATUS: { valor: StatusFiltro; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "previsto", label: "Previsto" },
  { valor: "vencido", label: "Vencido" },
  { valor: "pago", label: "Pago" },
  { valor: "cancelado", label: "Cancelado" },
];

const OPCOES_PERIODO: { valor: PeriodoFiltro; label: string }[] = [
  { valor: "hoje", label: "Hoje" },
  { valor: "30", label: "30 dias" },
  { valor: "60", label: "60 dias" },
  { valor: "90", label: "90 dias" },
  { valor: "todos", label: "Todos" },
];

function rotuloConcluido(tipo: TipoLancamento) {
  return tipo === "pagar" ? "Pago" : "Recebido";
}

function rotuloStatus(status: StatusFiltro, tipo: TipoLancamento) {
  if (status === "pago" || status === "recebido") return rotuloConcluido(tipo);
  return OPCOES_STATUS.find((o) => o.valor === status)?.label ?? status;
}

function formatarValor(valor: number) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(dataISO: string) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function montarHref(base: string, status: StatusFiltro, periodo: PeriodoFiltro) {
  const params = new URLSearchParams();
  if (status !== "todos") params.set("status", status);
  if (periodo !== "todos") params.set("periodo", periodo);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function ListaLancamentos({
  tipo,
  baseHref,
  lancamentos,
  categorias,
  statusAtual,
  periodoAtual,
}: ListaLancamentosProps) {
  const categoriaPorId = new Map(categorias.map((c) => [c.id, c.nome]));
  const rotuloContraparte = tipo === "pagar" ? "Fornecedor" : "Cliente";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-wrap gap-1">
          {OPCOES_STATUS.map((opcao) => (
            <Link
              key={opcao.valor}
              href={montarHref(baseHref, opcao.valor, periodoAtual)}
              className={cn(
                "rounded-sm px-3 py-1.5 text-sm transition-colors",
                statusAtual === opcao.valor
                  ? "bg-brand-700 text-white"
                  : "bg-surface border border-border text-ink-700 hover:bg-canvas"
              )}
            >
              {opcao.valor === "pago" ? rotuloConcluido(tipo) : opcao.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {OPCOES_PERIODO.map((opcao) => (
            <Link
              key={opcao.valor}
              href={montarHref(baseHref, statusAtual, opcao.valor)}
              className={cn(
                "rounded-sm px-3 py-1.5 text-sm transition-colors",
                periodoAtual === opcao.valor
                  ? "bg-brand-700 text-white"
                  : "bg-surface border border-border text-ink-700 hover:bg-canvas"
              )}
            >
              {opcao.label}
            </Link>
          ))}
        </div>
      </div>

      {lancamentos.length === 0 ? (
        <div className="card p-8 text-center space-y-2">
          <p className="text-sm text-ink-700">
            Nenhum lançamento encontrado com esse filtro.
          </p>
          <p className="text-sm text-ink-500">
            <Link href={`${baseHref}/novo`} className="text-brand-700 hover:underline">
              Cadastre manualmente
            </Link>{" "}
            ou importe uma planilha para ver seus dados aqui.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-ink-500">
                <th className="px-4 py-3 font-medium">{rotuloContraparte}</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 font-medium text-right">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((lancamento) => {
                const vencido = ehVencido(lancamento);
                const statusExibido = vencido ? "vencido" : lancamento.status;
                return (
                  <tr key={lancamento.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-ink-900">{lancamento.cliente_fornecedor}</td>
                    <td className="px-4 py-3 text-ink-700">{lancamento.descricao}</td>
                    <td className="px-4 py-3 text-ink-500">
                      {lancamento.categoria_id
                        ? categoriaPorId.get(lancamento.categoria_id) ?? "—"
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{formatarData(lancamento.vencimento)}</td>
                    <td className="px-4 py-3 text-right valor text-ink-900">
                      {formatarValor(lancamento.valor)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-sm px-2 py-0.5 text-xs font-medium",
                          statusExibido === "vencido" && "bg-red-50 text-radar-risco",
                          statusExibido === "previsto" && "bg-canvas text-ink-500",
                          (statusExibido === "pago" || statusExibido === "recebido") &&
                            "bg-emerald-50 text-radar-saudavel",
                          statusExibido === "cancelado" && "bg-canvas text-ink-300"
                        )}
                      >
                        {rotuloStatus(statusExibido as StatusFiltro, tipo)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`${baseHref}/${lancamento.id}/editar`}
                          className="text-brand-700 hover:underline"
                        >
                          Editar
                        </Link>
                        {lancamento.status === "previsto" && (
                          <>
                            <form action={concluirLancamento}>
                              <input type="hidden" name="id" value={lancamento.id} />
                              <input type="hidden" name="tipo" value={tipo} />
                              <button type="submit" className="text-brand-700 hover:underline">
                                Marcar {rotuloConcluido(tipo).toLowerCase()}
                              </button>
                            </form>
                            <form action={cancelarLancamento}>
                              <input type="hidden" name="id" value={lancamento.id} />
                              <input type="hidden" name="tipo" value={tipo} />
                              <button
                                type="submit"
                                className="text-ink-500 hover:text-radar-risco hover:underline"
                              >
                                Cancelar
                              </button>
                            </form>
                          </>
                        )}
                        {(lancamento.status === "pago" || lancamento.status === "recebido") && (
                          <form action={reverterLancamento}>
                            <input type="hidden" name="id" value={lancamento.id} />
                            <input type="hidden" name="tipo" value={tipo} />
                            <button type="submit" className="text-ink-500 hover:underline">
                              Reverter para previsto
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
