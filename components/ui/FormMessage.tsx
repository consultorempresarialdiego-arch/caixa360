export function FormMessage({ erro, sucesso }: { erro?: string; sucesso?: string }) {
  if (!erro && !sucesso) return null;
  return (
    <div
      className={
        erro
          ? "rounded-sm bg-red-50 border border-red-200 text-radar-risco text-sm px-3 py-2"
          : "rounded-sm bg-emerald-50 border border-emerald-200 text-radar-saudavel text-sm px-3 py-2"
      }
      role="status"
    >
      {erro || sucesso}
    </div>
  );
}
