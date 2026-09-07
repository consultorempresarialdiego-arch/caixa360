"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/lib/actions/auth";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { AjudaWhatsApp } from "@/components/layout/AjudaWhatsApp";

export default function LoginPage() {
  const [estado, formAction, pendente] = useActionState(login, null);

  return (
    <form action={formAction} className="space-y-4">
      <h1 className="text-lg font-semibold text-ink-900 mb-2">Entrar</h1>

      <FormMessage erro={estado?.erro} sucesso={estado?.sucesso} />

      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      <div>
        <Label htmlFor="senha">Senha</Label>
        <Input id="senha" name="senha" type="password" required autoComplete="current-password" />
      </div>

      <Button type="submit" disabled={pendente} className="w-full">
        {pendente ? "Entrando..." : "Entrar"}
      </Button>

      <div className="flex items-center justify-between text-sm pt-2">
        <Link href="/recuperar-senha" className="text-brand-700 hover:underline">
          Esqueci minha senha
        </Link>
        <Link href="/cadastro" className="text-brand-700 hover:underline">
          Criar conta
        </Link>
      </div>

      <AjudaWhatsApp />
    </form>
  );
}
