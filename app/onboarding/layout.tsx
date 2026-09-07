import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { usuarioTemEmpresaVinculada } from "@/lib/empresa";
import { sair } from "@/lib/actions/auth";
import { AjudaWhatsApp } from "@/components/layout/AjudaWhatsApp";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Segunda camada de defesa (mesma lógica de (app)/layout.tsx): não
  // depender só do middleware para garantir que existe sessão.
  if (!user) {
    redirect("/login");
  }

  // Usuário que já concluiu o onboarding não deve ver esta tela de novo —
  // manda direto para o Dashboard.
  const temEmpresa = await usuarioTemEmpresaVinculada();
  if (temEmpresa) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
        <span className="font-display text-lg font-bold text-ink-900">Caixa360</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-ink-500">{user?.email}</span>
          <form action={sair}>
            <button type="submit" className="text-sm text-ink-500 hover:text-ink-900">
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg space-y-4">
          {children}
          <AjudaWhatsApp />
        </div>
      </main>
    </div>
  );
}
