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
    listarLancamentos({ empresaId: empresa.id, tipo: "pagar", status: statusAtual, periodo: periodoAtual }),
    listarCategorias("despesa"),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">Contas a Pagar</h1>
        <Link href="/contas-a-pagar/novo" className="btn-primary">
          Nova conta a pagar
        </Link>
      </div>

      <ListaLancamentos
        tipo="pagar"
        baseHref="/contas-a-pagar"
        lancamentos={lancamentos}
        categorias={categorias}
        statusAtual={statusAtual}
        periodoAtual={periodoAtual}
      />
    </div>
  );
}
