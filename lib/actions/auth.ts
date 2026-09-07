"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logErro } from "@/lib/log";

export type EstadoFormulario = {
  erro?: string;
  sucesso?: string;
} | null;

/**
 * Cadastro: cria APENAS o usuário no Supabase Auth. Nenhuma empresa é
 * criada aqui — não coletamos dados de empresa neste formulário e não
 * criamos registro nenhum (nem temporário) com nome genérico. A empresa
 * só passa a existir quando o usuário preenche o onboarding (Fase 2) com
 * dados reais, através da função criar_empresa_inicial.
 */
export async function cadastrar(
  _estadoAnterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const nome = String(formData.get("nome") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const senha = String(formData.get("senha") || "");
  const confirmarSenha = String(formData.get("confirmarSenha") || "");

  if (!nome || !email || !senha) {
    return { erro: "Preencha todos os campos obrigatórios." };
  }
  if (senha.length < 8) {
    return { erro: "A senha precisa ter no mínimo 8 caracteres." };
  }
  if (senha !== confirmarSenha) {
    return { erro: "As senhas não coincidem." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error: erroCadastro } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (erroCadastro) {
    logErro("cadastrar", erroCadastro);
    return { erro: traduzirErroAuth(erroCadastro.message) };
  }

  // Se a confirmação de e-mail estiver ativa no projeto Supabase, ainda não
  // haverá sessão aqui — o usuário confirma o e-mail e faz login depois,
  // sendo então encaminhado ao onboarding pela própria lógica de login().
  const { data: sessao } = await supabase.auth.getSession();
  if (!sessao.session) {
    return {
      sucesso:
        "Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.",
    };
  }

  redirect("/onboarding");
}

/**
 * Login: autentica e encaminha o usuário para o lugar certo.
 * - Sem empresa vinculada ainda → /onboarding (obrigatório).
 * - Com empresa vinculada → /dashboard.
 * Nenhuma empresa é criada neste fluxo.
 */
export async function login(
  _estadoAnterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const email = String(formData.get("email") || "").trim();
  const senha = String(formData.get("senha") || "");

  if (!email || !senha) {
    return { erro: "Informe e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    logErro("login", error, { email });
    return { erro: "E-mail ou senha incorretos." };
  }

  const { data: vinculos } = await supabase
    .from("usuarios_empresas")
    .select("id")
    .limit(1);

  redirect(vinculos && vinculos.length > 0 ? "/dashboard" : "/onboarding");
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function solicitarRecuperacaoSenha(
  _estadoAnterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const email = String(formData.get("email") || "").trim();
  if (!email) {
    return { erro: "Informe seu e-mail." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/redefinir-senha`,
  });

  // Sempre retornamos sucesso, mesmo se o e-mail não existir — evita
  // confirmar para um atacante quais e-mails estão cadastrados.
  if (error) {
    logErro("solicitarRecuperacaoSenha", error);
  }

  return {
    sucesso:
      "Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.",
  };
}

export async function redefinirSenha(
  _estadoAnterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const novaSenha = String(formData.get("novaSenha") || "");
  const confirmarSenha = String(formData.get("confirmarSenha") || "");

  if (novaSenha.length < 8) {
    return { erro: "A senha precisa ter no mínimo 8 caracteres." };
  }
  if (novaSenha !== confirmarSenha) {
    return { erro: "As senhas não coincidem." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: novaSenha });

  if (error) {
    logErro("redefinirSenha", error);
    return { erro: "Não foi possível redefinir a senha. Solicite um novo link." };
  }

  redirect("/dashboard");
}

function traduzirErroAuth(mensagem: string): string {
  if (mensagem.includes("already registered")) {
    return "Este e-mail já está cadastrado.";
  }
  if (mensagem.includes("Password should be")) {
    return "A senha não atende aos requisitos mínimos de segurança.";
  }
  return "Não foi possível concluir o cadastro. Tente novamente.";
}
