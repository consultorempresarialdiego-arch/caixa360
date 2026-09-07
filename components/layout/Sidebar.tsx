"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ITENS_NAVEGACAO } from "./nav-items";
import { sair } from "@/lib/actions/auth";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:w-60 md:shrink-0 bg-ink-900 text-white min-h-screen">
      <div className="px-5 py-6">
        <span className="font-display text-xl font-bold">Caixa360</span>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {ITENS_NAVEGACAO.map((item) => {
          const ativo = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-sm px-3 py-2 text-sm transition-colors",
                ativo
                  ? "bg-brand-700 text-white"
                  : "text-ink-300 hover:bg-white/5 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <form action={sair} className="px-3 pb-6">
        <button
          type="submit"
          className="w-full text-left rounded-sm px-3 py-2 text-sm text-ink-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          Sair
        </button>
      </form>
    </aside>
  );
}
