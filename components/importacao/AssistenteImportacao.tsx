"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { cn, formatarMoeda } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { lerArquivo, validarArquivo, gerarTemplateXlsx, type ArquivoLido } from "@/lib/importacao/parsing";
import {
  sugerirMapeamento,
  interpretarLinha,
  type CampoImportacao,
  type CategoriaParaMatch,
  type LancamentoExistente,
  type LinhaInterpretada,
  type TipoPlanilha,
} from "@/lib/importacao/validacao";
import { importarLancamentos, type ResultadoImportacao } from "@/lib/actions/importacao";

const CAMPOS: { valor: CampoImportacao; label: string; obrigatorio: boolean }[] = [
  { valor: "clienteFornecedor", label: "Cliente/Fornecedor", obrigatorio: true },
  { valor: "descricao", label: "Descrição", obrigatorio: true },
  { valor: "vencimento", label: "Vencimento", obrigatorio: true },
  { valor: "valor", label: "Valor", obrigatorio: true },
  { valor: "categoria", label: "Categoria", obrigatorio: false },
  { valor: "status", label: "Status", obrigatorio: false },
  { valor: "dataPagamentoRecebimento", label: "Data de pagamento/recebimento", obrigatorio: false },
  { valor: "observacao", label: "Observação", obrigatorio: false },
];

interface AssistenteImportacaoProps {
  categorias: CategoriaParaMatch[];
  existentes: LancamentoExistente[];
}

export function AssistenteImportacao({ categorias, existentes }: AssistenteImportacaoProps) {
  const [etapa, setEtapa] = useState<1 | 2 | 3 | 4>(1);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arquivoLido, setArquivoLido] = useState<ArquivoLido | null>(null);
  const [tipoPlanilha, setTipoPlanilha] = useState<TipoPlanilha>({ modo: "fixo", tipo: "receber" });
  const [mapeamento, setMapeamento] = useState<Partial<Record<CampoImportacao, string>>>({});
  const [pularDuplicatas, setPularDuplicatas] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [pendente, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function selecionarArquivo(file: File) {
    setErro(null);
    const erroArquivo = validarArquivo(file);
    if (erroArquivo) {
      setErro(erroArquivo);
      return;
    }
    const { dados, erro: erroLeitura } = await lerArquivo(file);
    if (erroLeitura || !dados) {
      setErro(erroLeitura ?? "Não foi possível ler o arquivo.");
      return;
    }
    setArquivo(file);
    setArquivoLido(dados);
    setMapeamento(sugerirMapeamento(dados.headers));
  }

  function avancarParaMapeamento() {
    if (!arquivoLido) {
      setErro("Selecione um arquivo antes de continuar.");
      return;
    }
    setErro(null);
    setEtapa(2);
  }

  function avancarParaPreview() {
    if (tipoPlanilha.modo === "coluna" && !mapeamento.tipo) {
      setErro("Selecione qual coluna indica o tipo (pagar/receber).");
      return;
    }
    const faltando = CAMPOS.filter((c) => c.obrigatorio && !mapeamento[c.valor]);
    if (faltando.length > 0) {
      setErro(`Mapeie os campos obrigatórios: ${faltando.map((c) => c.label).join(", ")}.`);
      return;
    }
    setErro(null);
    setEtapa(3);
  }

  const linhasInterpretadas: LinhaInterpretada[] = useMemo(() => {
    if (!arquivoLido) return [];
    return arquivoLido.linhas.map((bruta, i) =>
      interpretarLinha({
        indice: i + 2,
        bruta,
        mapeamento,
        tipoPlanilha,
        categorias,
        existentes,
      })
    );
  }, [arquivoLido, mapeamento, tipoPlanilha, categorias, existentes]);

  const prontas = linhasInterpretadas.filter((l) => l.pronta);
  const comErro = linhasInterpretadas.filter((l) => !l.pronta);
  const duplicatas = prontas.filter((l) => l.possivelDuplicata);
  const paraImportar = pularDuplicatas ? prontas.filter((l) => !l.possivelDuplicata) : prontas;

  function confirmarImportacao() {
    if (!arquivo || !arquivoLido) return;
    setErro(null);
    startTransition(async () => {
      const linhas = paraImportar.map((l) => ({
        tipo: l.tipo!,
        clienteFornecedor: l.clienteFornecedor,
        descricao: l.descricao,
        categoriaId: l.categoriaId,
        vencimento: l.vencimento!,
        valorCentavos: l.valorCentavos!,
        status: l.status,
        dataPagamentoRecebimento: l.dataPagamentoRecebimento,
        observacao: l.observacao,
      }));

      const res = await importarLancamentos({
        linhas,
        arquivoNome: arquivo.name,
        formato: arquivoLido.formato,
        totalLinhasPlanilha: arquivoLido.linhas.length,
        duplicidadesPuladas: pularDuplicatas ? duplicatas.length : 0,
      });

      if ("erro" in res) {
        setErro(res.erro);
      } else {
        setResultado(res);
        setEtapa(4);
      }
    });
  }

  function recomecar() {
    setEtapa(1);
    setArquivo(null);
    setArquivoLido(null);
    setMapeamento({});
    setResultado(null);
    setErro(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-ink-500 tracking-wide">Etapa {etapa} de 4</p>

      <FormMessage erro={erro ?? undefined} />

      {etapa === 1 && (
        <div className="card p-6 space-y-5 max-w-lg">
          <div>
            <p className="text-sm font-medium text-ink-700 mb-2">1. Selecione o arquivo</p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) selecionarArquivo(file);
              }}
              className="input-base"
            />
            {arquivoLido && (
              <p className="text-sm text-radar-saudavel mt-2">
                ✓ {arquivo?.name} — {arquivoLido.linhas.length} linha(s) encontrada(s).
              </p>
            )}
            <button
              type="button"
              onClick={gerarTemplateXlsx}
              className="text-sm text-brand-700 hover:underline mt-2"
            >
              Baixar modelo de planilha (.xlsx)
            </button>
          </div>

          <div>
            <p className="text-sm font-medium text-ink-700 mb-2">2. Esta planilha é de quê?</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="radio"
                  checked={tipoPlanilha.modo === "fixo" && tipoPlanilha.tipo === "receber"}
                  onChange={() => setTipoPlanilha({ modo: "fixo", tipo: "receber" })}
                />
                Toda de Contas a Receber
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="radio"
                  checked={tipoPlanilha.modo === "fixo" && tipoPlanilha.tipo === "pagar"}
                  onChange={() => setTipoPlanilha({ modo: "fixo", tipo: "pagar" })}
                />
                Toda de Contas a Pagar
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="radio"
                  checked={tipoPlanilha.modo === "coluna"}
                  onChange={() => setTipoPlanilha({ modo: "coluna" })}
                />
                Tem uma coluna que indica o tipo linha a linha
              </label>
            </div>
          </div>

          <Button onClick={avancarParaMapeamento} disabled={!arquivoLido}>
            Avançar
          </Button>
        </div>
      )}

      {etapa === 2 && arquivoLido && (
        <div className="card p-6 space-y-4 max-w-lg">
          <p className="text-sm font-medium text-ink-700">Mapeamento de colunas</p>
          <p className="text-sm text-ink-500">
            Identificamos algumas colunas automaticamente. Confira e ajuste se necessário.
          </p>

          {tipoPlanilha.modo === "coluna" && (
            <div>
              <label className="label-field">Coluna do Tipo (pagar/receber)</label>
              <select
                className="input-base"
                value={mapeamento.tipo ?? ""}
                onChange={(e) => setMapeamento((m) => ({ ...m, tipo: e.target.value || undefined }))}
              >
                <option value="">Selecione a coluna</option>
                {arquivoLido.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          )}

          {CAMPOS.map((c) => (
            <div key={c.valor}>
              <label className="label-field">
                {c.label} {c.obrigatorio && <span className="text-radar-risco">*</span>}
              </label>
              <select
                className="input-base"
                value={mapeamento[c.valor] ?? ""}
                onChange={(e) =>
                  setMapeamento((m) => ({ ...m, [c.valor]: e.target.value || undefined }))
                }
              >
                <option value="">Nenhuma coluna</option>
                {arquivoLido.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setEtapa(1)}>
              Voltar
            </Button>
            <Button className="flex-1" onClick={avancarParaPreview}>
              Pré-visualizar
            </Button>
          </div>
        </div>
      )}

      {etapa === 3 && (
        <div className="space-y-4">
          <div className="card p-4 flex flex-wrap gap-4 text-sm">
            <span className="text-radar-saudavel font-medium">{prontas.length} linha(s) pronta(s)</span>
            <span className="text-radar-risco font-medium">{comErro.length} linha(s) com erro</span>
            <span className="text-radar-atencao font-medium">{duplicatas.length} possível(is) duplicata(s)</span>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={pularDuplicatas}
              onChange={(e) => setPularDuplicatas(e.target.checked)}
            />
            Pular possíveis duplicatas na importação
          </label>

          <div className="card overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-border text-left text-ink-500">
                  <th className="px-3 py-2 font-medium">Linha</th>
                  <th className="px-3 py-2 font-medium">Tipo</th>
                  <th className="px-3 py-2 font-medium">Cliente/Fornecedor</th>
                  <th className="px-3 py-2 font-medium">Descrição</th>
                  <th className="px-3 py-2 font-medium">Categoria</th>
                  <th className="px-3 py-2 font-medium">Vencimento</th>
                  <th className="px-3 py-2 font-medium text-right">Valor</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Mensagens</th>
                </tr>
              </thead>
              <tbody>
                {linhasInterpretadas.slice(0, 20).map((l) => (
                  <tr
                    key={l.indice}
                    className={cn(
                      "border-b border-border last:border-0",
                      !l.pronta && "bg-red-50",
                      l.pronta && l.possivelDuplicata && "bg-amber-50"
                    )}
                  >
                    <td className="px-3 py-2 text-ink-500">{l.indice}</td>
                    <td className="px-3 py-2 text-ink-700">{l.tipo ?? "—"}</td>
                    <td className="px-3 py-2 text-ink-700">{l.clienteFornecedor || "—"}</td>
                    <td className="px-3 py-2 text-ink-700">{l.descricao || "—"}</td>
                    <td className="px-3 py-2 text-ink-500">{l.categoriaNome || "—"}</td>
                    <td className="px-3 py-2 text-ink-700">{l.vencimento ?? "—"}</td>
                    <td className="px-3 py-2 text-right valor text-ink-900">
                      {l.valorCentavos !== null ? formatarMoeda(l.valorCentavos / 100) : "—"}
                    </td>
                    <td className="px-3 py-2 text-ink-700">{l.status}</td>
                    <td className="px-3 py-2">
                      {l.mensagens.map((m, i) => (
                        <p
                          key={i}
                          className={m.nivel === "erro" ? "text-radar-risco text-xs" : "text-radar-atencao text-xs"}
                        >
                          {m.texto}
                        </p>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {linhasInterpretadas.length > 20 && (
              <p className="text-xs text-ink-500 px-3 py-2">
                Mostrando as primeiras 20 de {linhasInterpretadas.length} linhas.
              </p>
            )}
          </div>

          <p className="text-sm text-ink-700">
            <strong>{paraImportar.length}</strong> lançamento(s) serão importados.
          </p>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setEtapa(2)} disabled={pendente}>
              Voltar
            </Button>
            <Button onClick={confirmarImportacao} disabled={pendente || prontas.length === 0}>
              {pendente ? "Importando..." : "Confirmar importação"}
            </Button>
          </div>
        </div>
      )}

      {etapa === 4 && resultado && "sucesso" in resultado && (
        <div className="card p-8 text-center space-y-4 max-w-lg">
          <h2 className="text-lg font-semibold text-ink-900">Importação concluída</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-2xl font-semibold text-radar-saudavel valor">{resultado.importadas}</p>
              <p className="text-xs text-ink-500">Importados</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-ink-500 valor">{resultado.ignoradas}</p>
              <p className="text-xs text-ink-500">Ignorados</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-radar-atencao valor">{resultado.duplicidadesPuladas}</p>
              <p className="text-xs text-ink-500">Duplicatas puladas</p>
            </div>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="secondary" onClick={recomecar}>
              Importar outro arquivo
            </Button>
            <Link href="/dashboard" className="btn-primary">
              Ir para o Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
