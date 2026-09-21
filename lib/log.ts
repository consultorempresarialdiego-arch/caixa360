/**
 * Ponto único de log de erro do servidor (Server Actions, Server Components,
 * funções de dados). Hoje só escreve em console.error — em produção na
 * Vercel isso já aparece nos logs da função automaticamente. Centralizar
 * aqui permite trocar por um serviço (ex.: Sentry) no futuro sem precisar
 * caçar cada chamada espalhada pelo código.
 */
export function logErro(contexto: string, erro: unknown, detalhes?: Record<string, unknown>): void {
  console.error(`[${contexto}]`, serializarErro(erro), detalhes ?? "");
}

/**
 * Erros do Supabase/PostgREST (ex.: falha de RLS, tabela fora do cache do
 * schema, permissão negada) não são instâncias de Error — são objetos
 * simples { message, details, hint, code }. `String(objeto)` produz
 * "[object Object]" e esconde a informação que diagnostica a causa. Aqui
 * extraímos os campos do Postgrest quando existem; para um Error nativo,
 * mantemos só a mensagem (mesmo comportamento de antes).
 */
function serializarErro(erro: unknown): unknown {
  if (erro instanceof Error) {
    return erro.message;
  }
  if (erro && typeof erro === "object") {
    const { message, details, hint, code } = erro as Record<string, unknown>;
    if (message !== undefined || details !== undefined || hint !== undefined || code !== undefined) {
      return { message, details, hint, code };
    }
  }
  return String(erro);
}
