import { RadarBackground } from "@/components/layout/RadarBackground";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-ink-900 flex items-center justify-center px-4 overflow-hidden">
      <RadarBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="font-display text-2xl font-bold text-white">Caixa360</span>
          <p className="text-ink-300 text-sm mt-1">
            Saiba hoje quanto dinheiro sua empresa terá.
          </p>
        </div>
        <div className="card p-8">{children}</div>
      </div>
    </div>
  );
}
