import { redirect } from "next/navigation";
import { obterEmpresaAtual } from "@/lib/empresa";
import { obterAssinaturaAtual, acessoLiberado } from "@/lib/assinatura";
import { sair } from "@/lib/actions/auth";

/**
 * Fica FORA do grupo (app) de propósito — se estivesse dentro, o próprio
 * layout que redireciona pra cá causaria loop. Refaz as mesmas checagens do
 * layout por segurança: alguém com acesso liberado que caia aqui direto por
 * URL é mandado de volta pro dashboard, nunca vê essa tela à toa.
 */
export default async function Pagina() {
  const empresa = await obterEmpresaAtual();
  if (!empresa) {
    redirect("/onboarding");
  }

  const assinatura = await obterAssinaturaAtual(empresa.id);
  if (acessoLiberado(assinatura)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="card p-8 max-w-md w-full text-center space-y-4">
        <h1 className="text-lg font-semibold text-ink-900">Acesso pendente</h1>
        <p className="text-sm text-ink-500">
          Ainda não identificamos a confirmação do seu pagamento. Assim que for
          confirmado, seu acesso ao Caixa360 é liberado. Se você já pagou,
          entre em contato para agilizarmos a liberação.
        </p>
        <form action={sair}>
          <button type="submit" className="text-sm text-ink-500 hover:text-ink-900 underline">
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}
