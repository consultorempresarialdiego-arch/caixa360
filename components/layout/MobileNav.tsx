"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ITENS_NAVEGACAO } from "./nav-items";
import { sair } from "@/lib/actions/auth";
import { Menu, X } from "lucide-react";

export function MobileNav() {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between bg-ink-900 text-white px-4 py-3">
        <span className="font-display text-lg font-bold">Caixa360</span>
        <button
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          onClick={() => setAberto((v) => !v)}
        >
          {aberto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {aberto && (
        <nav className="bg-ink-900 text-white px-3 pb-4 space-y-1">
          {ITENS_NAVEGACAO.map((item) => {
            const ativo = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAberto(false)}
                className={cn(
                  "block rounded-sm px-3 py-2 text-sm",
                  ativo ? "bg-brand-700 text-white" : "text-ink-300"
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <form action={sair}>
            <button type="submit" className="w-full text-left rounded-sm px-3 py-2 text-sm text-ink-300">
              Sair
            </button>
          </form>
        </nav>
      )}
    </div>
  );
}
