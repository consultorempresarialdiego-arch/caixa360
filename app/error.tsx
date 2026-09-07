"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { logErro } from "@/lib/log";

export default function ErroGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logErro("erro-nao-tratado-raiz", error, { digest: error.digest });
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
          <div className="card p-8 max-w-md w-full text-center space-y-4">
            <h1 className="text-lg font-semibold text-ink-900">
              Algo deu errado
            </h1>
            <p className="text-sm text-ink-500">
              Não foi possível carregar o Caixa360 agora. Isso pode ser uma
              instabilidade temporária — tente novamente em alguns instantes.
            </p>
            <Button className="w-full" onClick={reset}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
