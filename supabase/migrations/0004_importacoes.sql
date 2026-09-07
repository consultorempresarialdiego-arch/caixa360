-- ============================================================================
-- CAIXA360 — Migration 0004: Log de importações (Fase 8)
-- Cria a tabela "importacoes", usada como registro de AUDITORIA de cada
-- importação de planilha (Excel/CSV) feita por uma empresa.
--
-- Importante: esta tabela NÃO é dependência para a importação funcionar —
-- é só histórico/rastreabilidade (nenhuma tela de consulta é criada nesta
-- fase; a estrutura fica pronta para uma fase futura).
--
-- Esta migration é ADITIVA — não altera empresas, usuarios_empresas,
-- categorias nem lancamentos, e não mexe nas migrations 0001-0003.
-- ============================================================================

create table if not exists public.importacoes (
  id                           uuid primary key default gen_random_uuid(),
  empresa_id                   uuid not null references public.empresas (id) on delete cascade,
  usuario_id                   uuid not null references auth.users (id) on delete cascade,
  arquivo_nome                 text not null,
  formato                      text not null check (formato in ('xlsx', 'csv')),
  status                       text not null check (status in ('concluida', 'falhou')),
  total_linhas                 integer not null default 0,
  linhas_importadas            integer not null default 0,
  linhas_ignoradas             integer not null default 0,
  duplicidades_identificadas   integer not null default 0,
  criado_em                    timestamptz not null default now()
);

comment on table public.importacoes is 'Log de auditoria de importações de planilha (Fase 8). Não é dependência para a importação funcionar — só histórico/rastreabilidade.';

create index if not exists idx_importacoes_empresa_id on public.importacoes (empresa_id);

alter table public.importacoes enable row level security;

drop policy if exists "importacoes_select_por_vinculo" on public.importacoes;
create policy "importacoes_select_por_vinculo"
  on public.importacoes for select
  using (
    exists (
      select 1 from public.usuarios_empresas ue
      where ue.empresa_id = importacoes.empresa_id
        and ue.usuario_id = auth.uid()
    )
  );

drop policy if exists "importacoes_insert_por_vinculo" on public.importacoes;
create policy "importacoes_insert_por_vinculo"
  on public.importacoes for insert
  with check (
    usuario_id = auth.uid()
    and exists (
      select 1 from public.usuarios_empresas ue
      where ue.empresa_id = importacoes.empresa_id
        and ue.usuario_id = auth.uid()
    )
  );

-- Sem policy de UPDATE/DELETE: um log de auditoria não deve ser alterado
-- nem apagado pela aplicação.
