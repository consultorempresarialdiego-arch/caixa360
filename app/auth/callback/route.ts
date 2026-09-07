import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Callback usado por: confirmação de e-mail no cadastro e link de
 * recuperação de senha (resetPasswordForEmail). O Supabase troca o
 * código pela sessão e redirecionamos para o destino apropriado.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=link_invalido`);
}
