import { listarCategorias } from "@/lib/lancamentos";
import { LancamentoForm } from "@/components/lancamentos/LancamentoForm";

export default async function Pagina() {
  const categorias = await listarCategorias("despesa");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink-900">Nova conta a pagar</h1>
      <LancamentoForm tipo="pagar" categorias={categorias} />
    </div>
  );
}
