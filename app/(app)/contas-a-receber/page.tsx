import Link from "next/link";
import { redirect } from "next/navigation";
import { obterEmpresaAtual } from "@/lib/empresa";
import { listarLancamentos, listarCategorias, type PeriodoFiltro, type StatusFiltro } from "@/lib/lancamentos";
import { ListaLancamentos } from "@/components/lancamentos/ListaLancamentos";

export default async function Pagina({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; periodo?: string }>;
}) {
  const { status, periodo } = await searchParams;
  const statusAtual = (status ?? "todos") as StatusFiltro;
  const periodoAtual = (periodo ?? "todos") as PeriodoFiltro;

  const empresa = await obterEmpresaAtual();
  if (!empresa) redirect("/onboarding");

  const [lancamentos, categorias] = await Promise.all([
    listarLancamentos({ empresaId: empresa.id, tipo: "receber", status: statusAtual, periodo: periodoAtual }),
    listarCategorias("receita"),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">Contas a Receber</h1>
        <Link href="/contas-a-receber/novo" className="btn-primary">
          Nova conta a receber
        </Link>
      </div>

      <ListaLancamentos
        tipo="receber"
        baseHref="/contas-a-receber"
        lancamentos={lancamentos}
        categorias={categorias}
        statusAtual={statusAtual}
        periodoAtual={periodoAtual}
      />
    </div>
  );
}
