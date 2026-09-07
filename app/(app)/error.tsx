"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { logErro } from "@/lib/log";

export default function ErroAreaLogada({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logErro("erro-nao-tratado-app", error, { digest: error.digest });
  }, [error]);

  return (
    <div className="card p-8 max-w-md mx-auto text-center space-y-4">
      <h1 className="text-lg font-semibold text-ink-900">
        Não conseguimos carregar esta página
      </h1>
      <p className="text-sm text-ink-500">
        Pode ser uma instabilidade temporária na conexão com o banco de
        dados. Seus dados estão seguros — nada foi alterado.
      </p>
      <div className="flex gap-3 justify-center">
        <Button variant="secondary" onClick={reset}>
          Tentar novamente
        </Button>
        <Link href="/dashboard" className="btn-primary">
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
