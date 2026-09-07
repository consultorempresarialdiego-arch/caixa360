-- ============================================================================
-- CAIXA360 — Migration 0003: Categorias personalizadas (Fase 7)
-- Adiciona políticas de RLS de INSERT e DELETE em "categorias", permitindo
-- que cada empresa crie e exclua suas próprias categorias personalizadas.
--
-- Esta migration é ADITIVA — não cria tabela nova, não altera empresas,
-- lancamentos ou usuarios_empresas, não mexe nas migrations 0001/0002.
-- A tabela categorias e a policy de SELECT já existem desde a migration
-- 0002; o comentário daquela migration já previa que INSERT/DELETE viriam
-- nesta fase (Configurações).
-- ============================================================================

drop policy if exists "categorias_insert_por_vinculo" on public.categorias;
create policy "categorias_insert_por_vinculo"
  on public.categorias for insert
  with check (
    empresa_id is not null
    and exists (
      select 1 from public.usuarios_empresas ue
      where ue.empresa_id = categorias.empresa_id
        and ue.usuario_id = auth.uid()
    )
  );

-- Categorias fixas do sistema (empresa_id nulo) nunca podem ser excluídas
-- por ninguém: a condição "empresa_id is not null" garante isso — uma
-- categoria do sistema nunca satisfaz essa condição, então permanece
-- protegida mesmo sem nenhuma regra específica adicional.
drop policy if exists "categorias_delete_por_vinculo" on public.categorias;
create policy "categorias_delete_por_vinculo"
  on public.categorias for delete
  using (
    empresa_id is not null
    and exists (
      select 1 from public.usuarios_empresas ue
      where ue.empresa_id = categorias.empresa_id
        and ue.usuario_id = auth.uid()
    )
  );

-- Nenhuma policy de UPDATE: categorias personalizadas não podem ser
-- editadas/renomeadas nesta fase (aprovado na Decisão B da Fase 7) — só
-- criar e excluir.
