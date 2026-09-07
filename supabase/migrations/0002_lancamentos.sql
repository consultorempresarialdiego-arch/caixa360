-- ============================================================================
-- CAIXA360 — Migration 0002: Lançamentos (Fase 3)
-- Cria: tabela categorias (com seed das categorias fixas do sistema),
-- tabela lancamentos e políticas de Row Level Security.
--
-- Esta migration é ADITIVA — não altera nem apaga nada da migration 0001.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: categorias
-- empresa_id nulo = categoria padrão do sistema (fixa, MVP), visível para
-- todas as empresas. Categorias personalizadas por empresa ficam para uma
-- fase futura (Configurações) — não implementadas aqui.
-- ----------------------------------------------------------------------------
create table if not exists public.categorias (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid references public.empresas (id) on delete cascade,
  nome        text not null,
  tipo        text not null check (tipo in ('receita', 'despesa')),
  criado_em   timestamptz not null default now()
);

comment on table public.categorias is 'Categorias de lançamentos. empresa_id nulo = categoria padrão do sistema (fixa, MVP). Categorias personalizadas por empresa ficam para uma fase futura (Configurações).';

create index if not exists idx_categorias_empresa_id on public.categorias (empresa_id);

-- Seed idempotente: só insere as categorias padrão se ainda não existir
-- nenhuma categoria de sistema (empresa_id nulo) cadastrada.
insert into public.categorias (nome, tipo)
select v.nome, v.tipo
from (
  values
    ('Vendas', 'receita'),
    ('Serviços', 'receita'),
    ('Outras receitas', 'receita'),
    ('Pessoal', 'despesa'),
    ('Fornecedores', 'despesa'),
    ('Impostos', 'despesa'),
    ('Aluguel', 'despesa'),
    ('Tarifas/juros bancários', 'despesa'),
    ('Marketing', 'despesa'),
    ('Tecnologia', 'despesa'),
    ('Operação', 'despesa'),
    ('Outras despesas', 'despesa')
) as v(nome, tipo)
where not exists (
  select 1 from public.categorias where empresa_id is null
);

-- ----------------------------------------------------------------------------
-- Tabela: lancamentos
-- Tabela única para Contas a Pagar e Contas a Receber, diferenciadas pelo
-- campo "tipo" — simplifica o Fluxo de Caixa nas fases seguintes.
--
-- "Vencido" NÃO é um status armazenado aqui: é calculado pela aplicação
-- (status = 'previsto' e vencimento < hoje). O usuário nunca escolhe
-- "vencido" manualmente.
--
-- O vocabulário de status é diferente por tipo (não existe status genérico
-- "concluído"): Contas a Pagar usa 'pago', Contas a Receber usa 'recebido'.
-- A constraint "status_valido" garante essa combinação no banco.
-- ----------------------------------------------------------------------------
create table if not exists public.lancamentos (
  id                          uuid primary key default gen_random_uuid(),
  empresa_id                  uuid not null references public.empresas (id) on delete cascade,
  tipo                        text not null check (tipo in ('pagar', 'receber')),
  cliente_fornecedor          text not null,
  descricao                   text not null,
  categoria_id                uuid references public.categorias (id),
  vencimento                  date not null,
  valor                       numeric(14, 2) not null check (valor > 0),
  status                      text not null default 'previsto',
  data_pagamento_recebimento  date,
  observacao                  text,
  origem                      text not null default 'manual' check (origem in ('manual', 'importado')),
  criado_em                   timestamptz not null default now(),
  constraint status_valido check (
    (tipo = 'pagar'   and status in ('previsto', 'pago', 'cancelado')) or
    (tipo = 'receber' and status in ('previsto', 'recebido', 'cancelado'))
  )
);

comment on table public.lancamentos is 'Lançamentos financeiros (Contas a Pagar e a Receber), diferenciados pelo campo tipo. "Vencido" não é armazenado — é calculado pela aplicação (status=previsto e vencimento < hoje).';
comment on column public.lancamentos.status is 'pagar: previsto -> pago -> cancelado. receber: previsto -> recebido -> cancelado. Nunca "vencido" (isso é calculado).';

create index if not exists idx_lancamentos_empresa_id on public.lancamentos (empresa_id);
create index if not exists idx_lancamentos_vencimento on public.lancamentos (vencimento);
create index if not exists idx_lancamentos_status on public.lancamentos (status);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.categorias enable row level security;
alter table public.lancamentos enable row level security;

-- categorias: padrão do sistema (empresa_id nulo) visível a qualquer usuário
-- autenticado; categorias de empresa (fase futura) só visíveis por quem tem
-- vínculo com aquela empresa.
drop policy if exists "categorias_select" on public.categorias;
create policy "categorias_select"
  on public.categorias for select
  using (
    empresa_id is null
    or exists (
      select 1 from public.usuarios_empresas ue
      where ue.empresa_id = categorias.empresa_id
        and ue.usuario_id = auth.uid()
    )
  );

-- Nenhuma policy de INSERT/UPDATE/DELETE em categorias nesta fase —
-- categorias personalizadas ficam para Configurações (fase futura).

-- lancamentos: isolado por empresa via vínculo em usuarios_empresas.
drop policy if exists "lancamentos_select_por_vinculo" on public.lancamentos;
create policy "lancamentos_select_por_vinculo"
  on public.lancamentos for select
  using (
    exists (
      select 1 from public.usuarios_empresas ue
      where ue.empresa_id = lancamentos.empresa_id
        and ue.usuario_id = auth.uid()
    )
  );

drop policy if exists "lancamentos_insert_por_vinculo" on public.lancamentos;
create policy "lancamentos_insert_por_vinculo"
  on public.lancamentos for insert
  with check (
    exists (
      select 1 from public.usuarios_empresas ue
      where ue.empresa_id = lancamentos.empresa_id
        and ue.usuario_id = auth.uid()
    )
  );

drop policy if exists "lancamentos_update_por_vinculo" on public.lancamentos;
create policy "lancamentos_update_por_vinculo"
  on public.lancamentos for update
  using (
    exists (
      select 1 from public.usuarios_empresas ue
      where ue.empresa_id = lancamentos.empresa_id
        and ue.usuario_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.usuarios_empresas ue
      where ue.empresa_id = lancamentos.empresa_id
        and ue.usuario_id = auth.uid()
    )
  );

-- Nenhuma policy de DELETE: a Fase 3 usa cancelamento (soft, mantém
-- histórico), nunca exclusão definitiva — nem a interface, nem o banco
-- (via RLS) permitem apagar um lançamento.
