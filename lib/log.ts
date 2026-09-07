/**
 * Ponto único de log de erro do servidor (Server Actions, Server Components,
 * funções de dados). Hoje só escreve em console.error — em produção na
 * Vercel isso já aparece nos logs da função automaticamente. Centralizar
 * aqui permite trocar por um serviço (ex.: Sentry) no futuro sem precisar
 * caçar cada chamada espalhada pelo código.
 */
export function logErro(contexto: string, erro: unknown, detalhes?: Record<string, unknown>): void {
  const mensagem = erro instanceof Error ? erro.message : String(erro);
  console.error(`[${contexto}]`, mensagem, detalhes ?? "");
}
