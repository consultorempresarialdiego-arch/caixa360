import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

// Rotas de entrada não autenticada: sem sessão, ficam acessíveis; com
// sessão, o usuário é enviado de volta ao dashboard (não faz sentido ver
// tela de login/cadastro já logado).
// IMPORTANTE: "/redefinir-senha" foi deliberadamente removida desta lista.
// Diferente de login/cadastro, o usuário chega nela JÁ autenticado (sessão
// temporária criada pelo link de recuperação) e precisa continuar
// autenticado para conseguir trocar a senha — se estivesse aqui, a regra
// "autenticado + rota pública → dashboard" o expulsaria antes de conseguir
// usar a página.
const ROTAS_PUBLICAS = ["/login", "/cadastro", "/recuperar-senha"];

// Rotas que trocam um código por sessão (confirmação de e-mail e link de
// recuperação de senha). Precisam rodar independentemente do estado de
// autenticação no início da requisição — nunca são redirecionadas aqui,
// pois ainda não existe sessão até a própria rota processá-la.
const ROTAS_SEM_REGRA_DE_REDIRECIONAMENTO = ["/auth/callback"];

/**
 * Atualiza a sessão do Supabase a cada requisição e protege as rotas
 * autenticadas. Roda no middleware do Next.js.
 */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (ROTAS_SEM_REGRA_DE_REDIRECIONAMENTO.some((r) => path === r || path.startsWith(`${r}/`))) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isRotaPublica = ROTAS_PUBLICAS.includes(path);

  // Usuário não autenticado tentando acessar área logada (inclui
  // /redefinir-senha, que exige a sessão temporária de recuperação) → login.
  if (!user && !isRotaPublica && path !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Usuário já autenticado tentando acessar login/cadastro/recuperar-senha
  // → dashboard. /redefinir-senha não está em ROTAS_PUBLICAS, então nunca
  // cai nesta regra — usuário autenticado pode permanecer nela.
  if (user && isRotaPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
