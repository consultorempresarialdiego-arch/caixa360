import { notFound } from "next/navigation";
import { obterLancamento, listarCategorias } from "@/lib/lancamentos";
import { LancamentoForm } from "@/components/lancamentos/LancamentoForm";

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lancamento, categorias] = await Promise.all([
    obterLancamento(id),
    listarCategorias("receita"),
  ]);

  if (!lancamento || lancamento.tipo !== "receber") {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink-900">Editar conta a receber</h1>
      <LancamentoForm
        tipo="receber"
        categorias={categorias}
        valoresIniciais={{
          id: lancamento.id,
          clienteFornecedor: lancamento.cliente_fornecedor,
          descricao: lancamento.descricao,
          categoriaId: lancamento.categoria_id ?? "",
          vencimento: lancamento.vencimento,
          valorCentavos: Math.round(lancamento.valor * 100),
          observacao: lancamento.observacao ?? "",
        }}
      />
    </div>
  );
}
