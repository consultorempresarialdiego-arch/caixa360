import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { usuarioTemEmpresaVinculada } from "@/lib/empresa";
import { LandingPage } from "@/components/landing/LandingPage";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sem sessão: mostra a landing comercial (Fase 10.1) em vez de redirecionar
  // para /login — "/" agora é a porta de entrada pública do produto.
  if (!user) {
    return <LandingPage />;
  }

  const temEmpresa = await usuarioTemEmpresaVinculada();
  redirect(temEmpresa ? "/dashboard" : "/onboarding");
}
