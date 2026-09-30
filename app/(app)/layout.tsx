import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { createClient } from "@/lib/supabase/server";
import { obterEmpresaAtual } from "@/lib/empresa";
import { obterAssinaturaAtual, acessoLiberado } from "@/lib/assinatura";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Segunda camada de defesa: o middleware já deveria ter barrado um
  // usuário não autenticado antes de chegar aqui, mas este layout não
  // depende só dele — se, por qualquer motivo (mudança futura no
  // middleware, sessão expirada entre as duas checagens etc.), um usuário
  // sem sessão chegar até aqui, ele é redirecionado explicitamente.
  if (!user) {
    redirect("/login");
  }

  // Nenhuma tela da área autenticada (Dashboard, Contas a Pagar/Receber,
  // Fluxo de Caixa, Importação, Configurações) é acessível sem empresa
  // configurada.
  const empresa = await obterEmpresaAtual();
  if (!empresa) {
    redirect("/onboarding");
  }

  // Nem sem pagamento confirmado (status "pendente" além da carência) ou com
  // acesso pausado/cancelado — ver lib/assinatura.ts (acessoLiberado).
  const assinatura = await obterAssinaturaAtual(empresa.id);
  if (!acessoLiberado(assinatura)) {
    redirect("/acesso-bloqueado");
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav />
        <header className="hidden md:flex items-center justify-between border-b border-border bg-surface px-6 py-4">
          <div />
          <span className="text-sm text-ink-500">{user?.email}</span>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
