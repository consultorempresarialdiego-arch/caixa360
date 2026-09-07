"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormMessage } from "@/components/ui/FormMessage";
import { atualizarDadosEmpresa } from "@/lib/actions/configuracoes";
import { SETORES } from "@/lib/setores";
import { formatarMoeda } from "@/lib/utils";

interface AbaDadosEmpresaProps {
  nomeAtual: string;
  setorAtual: string;
  saldoAtualDinamico: number;
}

export function AbaDadosEmpresa({
  nomeAtual,
  setorAtual,
  saldoAtualDinamico,
}: AbaDadosEmpresaProps) {
  const setorEstaNaLista = (SETORES as readonly string[]).includes(setorAtual);

  const [nome, setNome] = useState(nomeAtual);
  const [setor, setSetor] = useState(setorEstaNaLista ? setorAtual : "Outro");
  const [setorOutro, setSetorOutro] = useState(setorEstaNaLista ? "" : setorAtual);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  const setorFinal = setor === "Outro" ? setorOutro.trim() : setor;

  function salvar() {
    setErro(null);
    setSucesso(null);
    startTransition(async () => {
      const resultado = await atualizarDadosEmpresa({ nome, setor: setorFinal });
      if (resultado?.erro) {
        setErro(resultado.erro);
      } else {
        setSucesso("Dados da empresa atualizados com sucesso.");
      }
    });
  }

  return (
    <div className="card p-6 space-y-4 max-w-lg">
      <FormMessage erro={erro ?? undefined} sucesso={sucesso ?? undefined} />

      <div>
        <Label htmlFor="nome-empresa-config">Nome da empresa</Label>
        <Input
          id="nome-empresa-config"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="setor-config">Setor</Label>
        <select
          id="setor-config"
          className="input-base"
          value={setor}
          onChange={(e) => setSetor(e.target.value)}
        >
          {SETORES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {setor === "Outro" && (
        <div>
          <Label htmlFor="setor-outro-config">Especifique o setor</Label>
          <Input
            id="setor-outro-config"
            value={setorOutro}
            onChange={(e) => setSetorOutro(e.target.value)}
            required
          />
        </div>
      )}

      <div>
        <Label>Saldo atual</Label>
        <p className="text-sm valor text-ink-900">{formatarMoeda(saldoAtualDinamico)}</p>
        <p className="text-xs text-ink-500 mt-1">
          Calculado automaticamente a partir dos lançamentos pagos/recebidos — não é editável aqui.
        </p>
      </div>

      <Button onClick={salvar} disabled={pendente}>
        {pendente ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );
}
