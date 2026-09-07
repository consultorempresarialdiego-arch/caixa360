"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormMessage } from "@/components/ui/FormMessage";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { criarEmpresa, type MetodoInicio } from "@/lib/actions/empresa";
import { SETORES } from "@/lib/setores";

const TOTAL_ETAPAS = 4;

export function OnboardingWizard() {
  const [etapa, setEtapa] = useState(1);
  const [nome, setNome] = useState("");
  const [setor, setSetor] = useState("");
  const [setorOutro, setSetorOutro] = useState("");
  const [saldoAtualCentavos, setSaldoAtualCentavos] = useState(0);
  const [caixaMinimoCentavos, setCaixaMinimoCentavos] = useState(0);
  const [metodoInicio, setMetodoInicio] = useState<MetodoInicio | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  const setorFinal = setor === "Outro" ? setorOutro.trim() : setor;

  const etapa2Valida = nome.trim() !== "" && setorFinal !== "";

  function avancar() {
    setErro(null);
    if (etapa === 2 && !etapa2Valida) {
      setErro("Preencha o nome e o setor da empresa para continuar.");
      return;
    }
    setEtapa((e) => Math.min(e + 1, TOTAL_ETAPAS));
  }

  function voltar() {
    setErro(null);
    setEtapa((e) => Math.max(e - 1, 1));
  }

  function concluir() {
    if (!metodoInicio) {
      setErro("Escolha como você quer começar.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      const resultado = await criarEmpresa({
        nome,
        setor: setorFinal,
        saldoAtualCentavos,
        caixaMinimoCentavos,
        metodoInicio,
      });
      if (resultado?.erro) {
        setErro(resultado.erro);
      }
      // Sucesso: a Server Action já fez o redirect (para /dashboard ou
      // /importacao) — nada a fazer aqui.
    });
  }

  return (
    <div className="card p-8 space-y-6">
      <p className="text-xs font-medium text-ink-500 tracking-wide">
        Etapa {etapa} de {TOTAL_ETAPAS}
      </p>

      <FormMessage erro={erro ?? undefined} />

      {etapa === 1 && (
        <div className="text-center space-y-5">
          <h1 className="text-lg font-semibold text-ink-900">
            Vamos deixar seu Caixa360 pronto em poucos minutos.
          </h1>
          <Button className="w-full" onClick={avancar}>
            Começar
          </Button>
        </div>
      )}

      {etapa === 2 && (
        <div className="space-y-4">
          <h1 className="text-lg font-semibold text-ink-900">Dados da empresa</h1>

          <div>
            <Label htmlFor="nome-empresa">Nome da empresa</Label>
            <Input
              id="nome-empresa"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="setor">Setor</Label>
            <select
              id="setor"
              className="input-base"
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              required
            >
              <option value="" disabled>
                Selecione um setor
              </option>
              {SETORES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {setor === "Outro" && (
            <div>
              <Label htmlFor="setor-outro">Especifique o setor</Label>
              <Input
                id="setor-outro"
                value={setorOutro}
                onChange={(e) => setSetorOutro(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="saldo-atual">Saldo atual em caixa/bancos</Label>
            <CurrencyInput
              id="saldo-atual"
              value={saldoAtualCentavos}
              onChange={setSaldoAtualCentavos}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={voltar}>
              Voltar
            </Button>
            <Button className="flex-1" onClick={avancar} disabled={!etapa2Valida}>
              Avançar
            </Button>
          </div>
        </div>
      )}

      {etapa === 3 && (
        <div className="space-y-4">
          <h1 className="text-lg font-semibold text-ink-900">Caixa mínimo</h1>
          <p className="text-sm text-ink-500">
            É o valor mínimo que você deseja manter disponível no caixa para
            operar com segurança.
          </p>

          <div>
            <Label htmlFor="caixa-minimo">Caixa mínimo desejado (opcional)</Label>
            <CurrencyInput
              id="caixa-minimo"
              value={caixaMinimoCentavos}
              onChange={setCaixaMinimoCentavos}
            />
          </div>

          {caixaMinimoCentavos === 0 && (
            <p className="text-sm text-ink-500">
              Sem um caixa mínimo definido, o Radar de Caixa mostrará seu
              saldo projetado, mas os alertas de risco ficarão desativados
              até você definir um valor.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={voltar}>
              Voltar
            </Button>
            <Button className="flex-1" onClick={avancar}>
              Avançar
            </Button>
          </div>
        </div>
      )}

      {etapa === 4 && (
        <div className="space-y-4">
          <h1 className="text-lg font-semibold text-ink-900">Como você quer começar?</h1>

          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              aria-pressed={metodoInicio === "manual"}
              onClick={() => setMetodoInicio("manual")}
              className={cn(
                "text-left rounded-md border px-4 py-3 transition-colors",
                metodoInicio === "manual"
                  ? "border-brand-700 bg-brand-200/40 ring-1 ring-brand-700"
                  : "border-border hover:bg-canvas"
              )}
            >
              <p className="text-sm font-medium text-ink-900">Cadastrar manualmente</p>
              <p className="text-sm text-ink-500">
                Você vai direto para o Dashboard e cadastra suas contas quando quiser.
              </p>
            </button>

            <button
              type="button"
              aria-pressed={metodoInicio === "importar"}
              onClick={() => setMetodoInicio("importar")}
              className={cn(
                "text-left rounded-md border px-4 py-3 transition-colors",
                metodoInicio === "importar"
                  ? "border-brand-700 bg-brand-200/40 ring-1 ring-brand-700"
                  : "border-border hover:bg-canvas"
              )}
            >
              <p className="text-sm font-medium text-ink-900">Importar planilha</p>
              <p className="text-sm text-ink-500">
                Leve uma planilha existente para popular suas contas de uma vez.
              </p>
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={voltar} disabled={pendente}>
              Voltar
            </Button>
            <Button
              className="flex-1"
              onClick={concluir}
              disabled={pendente || !metodoInicio}
            >
              {pendente ? "Concluindo..." : "Concluir"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
