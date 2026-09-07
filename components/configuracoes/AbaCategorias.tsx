"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormMessage } from "@/components/ui/FormMessage";
import { criarCategoria, excluirCategoria } from "@/lib/actions/configuracoes";

export type CategoriaExibicao = {
  id: string;
  nome: string;
  tipo: "receita" | "despesa";
  empresaId: string | null;
};

export function AbaCategorias({ categorias }: { categorias: CategoriaExibicao[] }) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"receita" | "despesa">("despesa");
  const [erroCriacao, setErroCriacao] = useState<string | null>(null);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  const fixas = categorias.filter((c) => c.empresaId === null);
  const personalizadas = categorias.filter((c) => c.empresaId !== null);

  function adicionar() {
    setErroCriacao(null);
    startTransition(async () => {
      const resultado = await criarCategoria({ nome, tipo });
      if (resultado?.erro) {
        setErroCriacao(resultado.erro);
      } else {
        setNome("");
      }
    });
  }

  function excluir(id: string) {
    setErroExclusao(null);
    setExcluindoId(id);
    startTransition(async () => {
      const resultado = await excluirCategoria(id);
      if (resultado?.erro) {
        setErroExclusao(resultado.erro);
      }
      setExcluindoId(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="card p-6 space-y-4 max-w-lg">
        <p className="text-sm font-medium text-ink-700">Nova categoria</p>
        <FormMessage erro={erroCriacao ?? undefined} />
        <div>
          <Label htmlFor="nome-categoria">Nome</Label>
          <Input id="nome-categoria" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="tipo-categoria">Tipo</Label>
          <select
            id="tipo-categoria"
            className="input-base"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "receita" | "despesa")}
          >
            <option value="despesa">Despesa</option>
            <option value="receita">Receita</option>
          </select>
        </div>
        <Button onClick={adicionar} disabled={pendente}>
          {pendente && !excluindoId ? "Adicionando..." : "Adicionar categoria"}
        </Button>
      </div>

      <div className="card p-6 space-y-3">
        <p className="text-sm font-medium text-ink-700">Categorias do sistema</p>
        <p className="text-xs text-ink-500">Fixas, disponíveis para todas as empresas — não podem ser excluídas.</p>
        <ul className="space-y-1">
          {fixas.map((c) => (
            <li key={c.id} className="text-sm text-ink-700 flex justify-between">
              <span>{c.nome}</span>
              <span className="text-ink-500">{c.tipo === "receita" ? "Receita" : "Despesa"}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-6 space-y-3">
        <p className="text-sm font-medium text-ink-700">Suas categorias personalizadas</p>
        <FormMessage erro={erroExclusao ?? undefined} />
        {personalizadas.length === 0 ? (
          <p className="text-sm text-ink-500">Nenhuma categoria personalizada ainda.</p>
        ) : (
          <ul className="space-y-1">
            {personalizadas.map((c) => (
              <li key={c.id} className="text-sm text-ink-700 flex justify-between items-center">
                <span>
                  {c.nome} <span className="text-ink-500">({c.tipo === "receita" ? "Receita" : "Despesa"})</span>
                </span>
                <button
                  type="button"
                  onClick={() => excluir(c.id)}
                  disabled={pendente && excluindoId === c.id}
                  className="text-ink-500 hover:text-radar-risco hover:underline text-sm"
                >
                  {pendente && excluindoId === c.id ? "Excluindo..." : "Excluir"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
