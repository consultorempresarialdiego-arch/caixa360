-- ============================================================================
-- CAIXA360 — Migration 0007: Grants explícitos para o role authenticated
-- Concede, de forma explícita, os privilégios de tabela que o role
-- "authenticated" precisa para as políticas de RLS das migrations 0001-0006
-- funcionarem — sem esse GRANT, o Postgres barra a consulta ANTES mesmo de
-- avaliar a RLS ("permission denied for table ...", code 42501), mesmo com
-- as policies corretas.
--
-- Motivação: nenhuma migration anterior continha GRANT explícito — o setup
-- dependia do Supabase conceder esses privilégios por padrão a tabelas novas
-- do schema public. Em um projeto de produção recém-criado isso não
-- aconteceu, quebrando o app inteiro após o primeiro login (detectado e
-- diagnosticado na Fase 10.x). Esta migration torna o setup autossuficiente:
-- uma instalação nova do CAIXA360 não depende mais de nenhum passo manual
-- de permissão fora das migrations.
--
-- Esta migration é ADITIVA — só concede privilégios, não cria/altera
-- tabela, coluna, policy ou função nenhuma das migrations 0001-0006.
-- O privilégio concedido por tabela espelha exatamente as operações já
-- permitidas pelas policies de RLS existentes (nenhum privilégio a mais):
--   - usuarios_empresas / assinaturas: só SELECT (INSERT é feito só via
--     criar_empresa_inicial(), SECURITY DEFINER, que não depende de GRANT).
--   - empresas: SELECT, UPDATE (mesma razão acima para INSERT).
--   - categorias: SELECT, INSERT, DELETE (sem UPDATE — decisão da Fase 7).
--   - lancamentos: SELECT, INSERT, UPDATE (sem DELETE — só cancelamento).
--   - importacoes: SELECT, INSERT (log de auditoria — sem UPDATE/DELETE).
-- ============================================================================

grant select on public.usuarios_empresas to authenticated;
grant select, update on public.empresas to authenticated;
grant select, insert, delete on public.categorias to authenticated;
grant select, insert, update on public.lancamentos to authenticated;
grant select, insert on public.importacoes to authenticated;
grant select on public.assinaturas to authenticated;
