import { cn } from "@/lib/utils";

interface CardResumoProps {
  titulo: string;
  valor: string;
  tom?: "positivo" | "negativo" | "neutro";
}

export function CardResumo({ titulo, valor, tom = "neutro" }: CardResumoProps) {
  return (
    <div className="card p-4">
      <p className="text-xs text-ink-500">{titulo}</p>
      <p
        className={cn(
          "text-lg font-semibold valor mt-1",
          tom === "positivo" && "text-radar-saudavel",
          tom === "negativo" && "text-radar-risco",
          tom === "neutro" && "text-ink-900"
        )}
      >
        {valor}
      </p>
    </div>
  );
}
