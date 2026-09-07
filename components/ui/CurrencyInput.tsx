"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

function formatarCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

interface CurrencyInputProps {
  id?: string;
  value: number; // sempre em centavos (inteiro) — nunca float de reais
  onChange: (centavos: number) => void;
  className?: string;
  disabled?: boolean;
  "aria-describedby"?: string;
}

/**
 * Input de valores monetários (BRL) que guarda o valor internamente em
 * centavos (inteiro). Evita erros de arredondamento de ponto flutuante:
 * nunca fazemos matemática com "reais fracionários" no estado do React.
 */
export function CurrencyInput({
  id,
  value,
  onChange,
  className,
  disabled,
  ...props
}: CurrencyInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  function lidarComMudanca(evento: React.ChangeEvent<HTMLInputElement>) {
    const apenasDigitos = evento.target.value.replace(/\D/g, "");
    const centavos = apenasDigitos ? parseInt(apenasDigitos, 10) : 0;
    onChange(centavos);
  }

  return (
    <input
      id={inputId}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      disabled={disabled}
      className={cn("input-base text-right valor", className)}
      value={formatarCentavos(value)}
      onChange={lidarComMudanca}
      {...props}
    />
  );
}
