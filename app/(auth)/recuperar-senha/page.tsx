"use client";

import { useActionState } from "react";
import Link from "next/link";
import { solicitarRecuperacaoSenha } from "@/lib/actions/auth";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";

export default function RecuperarSenhaPage() {
  const [estado, formAction, pendente] = useActionState(solicitarRecuperacaoSenha, null);

  return (
    <form action={formAction} className="space-y-4">
      <h1 className="text-lg font-semibold text-ink-900 mb-2">Recuperar senha</h1>
      <p className="text-sm text-ink-500">
        Informe seu e-mail para receber um link de redefinição de senha.
      </p>

      <FormMessage erro={estado?.erro} sucesso={estado?.sucesso} />

      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      <Button type="submit" disabled={pendente} className="w-full">
        {pendente ? "Enviando..." : "Enviar link de recuperação"}
      </Button>

      <p className="text-sm text-center pt-2">
        <Link href="/login" className="text-brand-700 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </form>
  );
}
