import Link from "next/link";
import { cn } from "@/lib/utils";

const ABAS = [
  { valor: "empresa", label: "Dados da empresa" },
  { valor: "caixa-minimo", label: "Caixa mínimo" },
  { valor: "categorias", label: "Categorias" },
  { valor: "plano", label: "Plano" },
] as const;

export type AbaConfiguracoes = (typeof ABAS)[number]["valor"];
export const ABAS_CONFIGURACOES: AbaConfiguracoes[] = ABAS.map((a) => a.valor);

export function NavegacaoAbas({ atual }: { atual: AbaConfiguracoes }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border pb-3">
      {ABAS.map((aba) => (
        <Link
          key={aba.valor}
          href={`/configuracoes?aba=${aba.valor}`}
          className={cn(
            "rounded-sm px-3 py-1.5 text-sm transition-colors",
            atual === aba.valor
              ? "bg-brand-700 text-white"
              : "bg-surface border border-border text-ink-700 hover:bg-canvas"
          )}
        >
          {aba.label}
        </Link>
      ))}
    </div>
  );
}
