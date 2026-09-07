"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormMessage } from "@/components/ui/FormMessage";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import {
  criarLancamento,
  atualizarLancamento,
  type TipoLancamento,
} from "@/lib/actions/lancamentos";

type Categoria = { id: string; nome: string };

export type ValoresIniciaisLancamento = {
  id: string;
  clienteFornecedor: string;
  descricao: string;
  categoriaId: string;
  vencimento: string;
  valorCentavos: number;
  observacao: string;
};

interface LancamentoFormProps {
  tipo: TipoLancamento;
  categorias: Categoria[];
  valoresIniciais?: ValoresIniciaisLancamento;
}

export function LancamentoForm({ tipo, categorias, valoresIniciais }: LancamentoFormProps) {
  const editando = !!valoresIniciais;
  const rotuloContraparte = tipo === "pagar" ? "Fornecedor" : "Cliente";

  const [clienteFornecedor, setClienteFornecedor] = useState(
    valoresIniciais?.clienteFornecedor ?? ""
  );
  const [descricao, setDescricao] = useState(valoresIniciais?.descricao ?? "");
  const [categoriaId, setCategoriaId] = useState(valoresIniciais?.categoriaId ?? "");
  const [vencimento, setVencimento] = useState(valoresIniciais?.vencimento ?? "");
  const [valorCentavos, setValorCentavos] = useState(valoresIniciais?.valorCentavos ?? 0);
  const [observacao, setObservacao] = useState(valoresIniciais?.observacao ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function salvar() {
    setErro(null);
    startTransition(async () => {
      const entrada = {
        tipo,
        clienteFornecedor,
        descricao,
        categoriaId,
        vencimento,
        valorCentavos,
        observacao,
      };

      const resultado = editando
        ? await atualizarLancamento(valoresIniciais!.id, entrada)
        : await criarLancamento(entrada);

      if (resultado?.erro) {
        setErro(resultado.erro);
      }
      // Sucesso: a Server Action já redireciona para a lista.
    });
  }

  return (
    <div className="card p-6 space-y-4 max-w-lg">
      <FormMessage erro={erro ?? undefined} />

      <div>
        <Label htmlFor="cliente-fornecedor">{rotuloContraparte}</Label>
        <Input
          id="cliente-fornecedor"
          value={clienteFornecedor}
          onChange={(e) => setClienteFornecedor(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Input
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="categoria">Categoria</Label>
        <select
          id="categoria"
          className="input-base"
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          required
        >
          <option value="" disabled>
            Selecione uma categoria
          </option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="vencimento">Vencimento</Label>
        <Input
          id="vencimento"
          type="date"
          value={vencimento}
          onChange={(e) => setVencimento(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="valor">Valor</Label>
        <CurrencyInput id="valor" value={valorCentavos} onChange={setValorCentavos} />
      </div>

      <div>
        <Label htmlFor="observacao">Observação (opcional)</Label>
        <textarea
          id="observacao"
          className="input-base"
          rows={3}
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />
      </div>

      <Button className="w-full" onClick={salvar} disabled={pendente}>
        {pendente ? "Salvando..." : editando ? "Salvar alterações" : "Salvar"}
      </Button>
    </div>
  );
}
