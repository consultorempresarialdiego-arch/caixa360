"use client";

import { useActionState } from "react";
import { redefinirSenha } from "@/lib/actions/auth";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";

export default function RedefinirSenhaPage() {
  const [estado, formAction, pendente] = useActionState(redefinirSenha, null);

  return (
    <form action={formAction} className="space-y-4">
      <h1 className="text-lg font-semibold text-ink-900 mb-2">Definir nova senha</h1>

      <FormMessage erro={estado?.erro} sucesso={estado?.sucesso} />

      <div>
        <Label htmlFor="novaSenha">Nova senha</Label>
        <Input id="novaSenha" name="novaSenha" type="password" required minLength={8} autoComplete="new-password" />
      </div>

      <div>
        <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
        <Input id="confirmarSenha" name="confirmarSenha" type="password" required minLength={8} autoComplete="new-password" />
      </div>

      <Button type="submit" disabled={pendente} className="w-full">
        {pendente ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
