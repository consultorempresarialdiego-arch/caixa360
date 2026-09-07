export function CarregandoPagina() {
  return (
    <div className="space-y-4 animate-pulse" role="status" aria-label="Carregando">
      <div className="h-6 w-48 rounded-sm bg-border" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card h-24" />
        <div className="card h-24" />
        <div className="card h-24" />
      </div>
      <div className="card h-64" />
    </div>
  );
}
