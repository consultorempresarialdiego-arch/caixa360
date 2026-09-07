/** Moldura de "janela" usada para emoldurar prints/mockups reais do produto na landing. */
export function MockupFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface shadow-lg overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-canvas">
        <span className="w-2.5 h-2.5 rounded-full bg-radar-risco/40" />
        <span className="w-2.5 h-2.5 rounded-full bg-radar-atencao/40" />
        <span className="w-2.5 h-2.5 rounded-full bg-radar-saudavel/40" />
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}
