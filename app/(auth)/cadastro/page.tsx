"use client";

import { useActionState } from "react";
import Link from "next/link";
import { cadastrar } from "@/lib/actions/auth";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { AjudaWhatsApp } from "@/components/layout/AjudaWhatsApp";

export default function CadastroPage() {
  const [estado, formAction, pendente] = useActionState(cadastrar, null);

  return (
    <form action={formAction} className="space-y-4">
      <h1 className="text-lg font-semibold text-ink-900 mb-1">Criar conta</h1>
      <p className="text-sm text-ink-500 mb-3">
        Depois de criar sua conta, você vai configurar sua empresa em poucos passos.
      </p>

      <FormMessage erro={estado?.erro} sucesso={estado?.sucesso} />

      <div>
        <Label htmlFor="nome">Seu nome</Label>
        <Input id="nome" name="nome" type="text" required autoComplete="name" />
      </div>

      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      <div>
        <Label htmlFor="senha">Senha</Label>
        <Input id="senha" name="senha" type="password" required minLength={8} autoComplete="new-password" />
      </div>

      <div>
        <Label htmlFor="confirmarSenha">Confirmar senha</Label>
        <Input id="confirmarSenha" name="confirmarSenha" type="password" required minLength={8} autoComplete="new-password" />
      </div>

      <Button type="submit" disabled={pendente} className="w-full">
        {pendente ? "Criando conta..." : "Criar conta"}
      </Button>

      <p className="text-sm text-center pt-2 text-ink-500">
        Já tem conta?{" "}
        <Link href="/login" className="text-brand-700 hover:underline">
          Entrar
        </Link>
      </p>

      <AjudaWhatsApp />
    </form>
  );
}
