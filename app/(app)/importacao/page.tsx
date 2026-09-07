import { redirect } from "next/navigation";
import { obterEmpresaAtual } from "@/lib/empresa";
import { createClient } from "@/lib/supabase/server";
import { logErro } from "@/lib/log";
import { AssistenteImportacao } from "@/components/importacao/AssistenteImportacao";

export default async function Pagina() {
  const empresa = await obterEmpresaAtual();
  if (!empresa) redirect("/onboarding");

  const supabase = await createClient();
  const [
    { data: categoriasData, error: erroCategorias },
    { data: lancamentosData, error: erroLancamentos },
  ] = await Promise.all([
    supabase.from("categorias").select("id, nome, tipo"),
    supabase
      .from("lancamentos")
      .select("tipo, cliente_fornecedor, vencimento, valor, status")
      .eq("empresa_id", empresa.id),
  ]);

  if (erroCategorias || erroLancamentos) {
    logErro("importacao.page", erroCategorias ?? erroLancamentos, { empresaId: empresa.id });
    throw new Error("Não foi possível carregar os dados de importação. Tente novamente.");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Importação</h1>
        <p className="text-sm text-ink-500">
          Traga uma planilha (.xlsx ou .csv) que você já usa e importe seus lançamentos para o
          CAIXA360.
        </p>
      </div>
      <AssistenteImportacao categorias={categoriasData ?? []} existentes={lancamentosData ?? []} />
    </div>
  );
}
