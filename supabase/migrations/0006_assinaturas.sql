-- ============================================================================
-- CAIXA360 — Migration 0006: Modelo de status comercial (Fase 10.3)
-- Cria a tabela "assinaturas" — 1 registro por empresa, representando a fase
-- comercial atual (acesso antecipado / ativa / pausada / cancelada).
--
-- Deliberadamente NÃO inclui plano, preço, gateway_customer_id nem nenhum
-- campo de cobrança — ainda não há preço, plano nem gateway definidos.
-- Quando a cobrança for desenhada, o modelo de assinatura definitivo será
-- criado de acordo com a solução escolhida (decisão registrada na Fase 10).
--
-- Esta migration é ADITIVA — não altera nem apaga nada das migrations
-- 0001-0005. A função criar_empresa_inicial() é substituída (create or
-- replace, mesmo corpo da migration 0001 + a criação da assinatura) para
-- toda empresa nova já nascer com uma assinatura em 'acesso_antecipado'.
-- ============================================================================

create table if not exists public.assinaturas (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null unique references public.empresas (id) on delete cascade,
  status        text not null check (status in ('acesso_antecipado', 'ativa', 'pausada', 'cancelada')),
  inicio_em     timestamptz not null,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.assinaturas is 'Status comercial da empresa (Fase 10.3) — sem plano/preço/cobrança ainda; isso vem quando o modelo de cobrança for definido. 1 linha por empresa.';

create index if not exists idx_assinaturas_empresa_id on public.assinaturas (empresa_id);

-- atualizado_em sempre reflete a última alteração da linha (você altera o
-- status manualmente pelo SQL Editor enquanto não houver tela de admin).
create or replace function public.assinaturas_atualizar_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_assinaturas_atualizado_em on public.assinaturas;
create trigger trg_assinaturas_atualizado_em
  before update on public.assinaturas
  for each row
  execute function public.assinaturas_atualizar_timestamp();

alter table public.assinaturas enable row level security;

-- Select: só quem tem vínculo com a empresa consegue ler o próprio status.
drop policy if exists "assinaturas_select_por_vinculo" on public.assinaturas;
create policy "assinaturas_select_por_vinculo"
  on public.assinaturas for select
  using (
    exists (
      select 1 from public.usuarios_empresas ue
      where ue.empresa_id = assinaturas.empresa_id
        and ue.usuario_id = auth.uid()
    )
  );

-- Nenhuma policy de INSERT/UPDATE/DELETE: a criação só acontece dentro de
-- criar_empresa_inicial() (SECURITY DEFINER, abaixo); mudança de status é
-- feita manualmente por você via SQL Editor (service role, ignora RLS) —
-- nenhum usuário consegue alterar o próprio status comercial pela API.

-- Backfill: empresas já existentes que ainda não têm assinatura ganham uma
-- com status 'acesso_antecipado' e inicio_em = data de criação da empresa.
insert into public.assinaturas (empresa_id, status, inicio_em)
select e.id, 'acesso_antecipado', e.criado_em
from public.empresas e
where not exists (
  select 1 from public.assinaturas a where a.empresa_id = e.id
);

-- criar_empresa_inicial() passa a criar também a assinatura da empresa nova,
-- na mesma transação (atômico) — corpo idêntico ao da migration 0001, só
-- com o insert em "assinaturas" adicionado ao final.
create or replace function public.criar_empresa_inicial(
  p_nome text,
  p_setor text default null,
  p_saldo_atual numeric default 0,
  p_caixa_minimo numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if exists (
    select 1 from public.usuarios_empresas ue where ue.usuario_id = auth.uid()
  ) then
    raise exception 'Usuário já possui empresa vinculada. Não é possível criar outra pelo fluxo do MVP.';
  end if;

  insert into public.empresas (nome, setor, saldo_atual, caixa_minimo)
  values (p_nome, p_setor, coalesce(p_saldo_atual, 0), p_caixa_minimo)
  returning id into v_empresa_id;

  insert into public.usuarios_empresas (usuario_id, empresa_id, papel)
  values (auth.uid(), v_empresa_id, 'admin');

  insert into public.assinaturas (empresa_id, status, inicio_em)
  values (v_empresa_id, 'acesso_antecipado', now());

  return v_empresa_id;
end;
$$;

comment on function public.criar_empresa_inicial is 'Cria empresa + vínculo usuário-empresa + assinatura (status acesso_antecipado) de forma atômica, chamada pelo onboarding (Fase 2). Único caminho suportado para criar uma empresa no MVP; bloqueia usuário sem sessão e usuário que já possui empresa.';
