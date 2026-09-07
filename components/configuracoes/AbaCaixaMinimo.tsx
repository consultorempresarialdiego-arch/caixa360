"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { FormMessage } from "@/components/ui/FormMessage";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { atualizarDadosEmpresa } from "@/lib/actions/configuracoes";

interface AbaCaixaMinimoProps {
  caixaMinimoCentavosInicial: number;
}

export function AbaCaixaMinimo({ caixaMinimoCentavosInicial }: AbaCaixaMinimoProps) {
  const [caixaMinimoCentavos, setCaixaMinimoCentavos] = useState(caixaMinimoCentavosInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function salvar() {
    setErro(null);
    setSucesso(null);
    startTransition(async () => {
      const resultado = await atualizarDadosEmpresa({ caixaMinimoCentavos });
      if (resultado?.erro) {
        setErro(resultado.erro);
      } else {
        setSucesso("Caixa mínimo atualizado com sucesso.");
      }
    });
  }

  return (
    <div className="card p-6 space-y-4 max-w-md">
      <FormMessage erro={erro ?? undefined} sucesso={sucesso ?? undefined} />

      <p className="text-sm text-ink-500">
        É o valor mínimo que você deseja manter disponível no caixa para operar com segurança.
        Deixe em R$ 0,00 para desativar os alertas de risco do Radar de Caixa.
      </p>

      <div>
        <Label htmlFor="caixa-minimo-config">Caixa mínimo desejado</Label>
        <CurrencyInput
          id="caixa-minimo-config"
          value={caixaMinimoCentavos}
          onChange={setCaixaMinimoCentavos}
        />
      </div>

      <Button onClick={salvar} disabled={pendente}>
        {pendente ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );
}
