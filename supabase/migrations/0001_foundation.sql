-- ============================================================================
-- CAIXA360 — Migration 0001: Fundação (Fase 1)
-- Cria: tabela empresas, tabela usuarios_empresas, função de criação atômica
-- e políticas de Row Level Security.
--
-- Esta migration é ADITIVA (cria tabelas novas) — não apaga nem altera
-- nada existente. Ainda assim, revise antes de aplicar em um projeto com
-- dados reais.
-- ============================================================================

-- Extensão necessária para gen_random_uuid()
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Tabela: empresas
-- ----------------------------------------------------------------------------
create table if not exists public.empresas (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  setor         text,
  saldo_atual   numeric(14, 2) not null default 0,
  caixa_minimo  numeric(14, 2), -- nulo = alertas do Radar desativados (Etapa 2)
  criado_em     timestamptz not null default now()
);

comment on table public.empresas is 'Empresas cadastradas na plataforma. Uma empresa concentra todos os dados financeiros (Fases futuras).';
comment on column public.empresas.caixa_minimo is 'Nulo = usuário ainda não definiu; Radar de Caixa não classifica risco nesse caso.';

-- ----------------------------------------------------------------------------
-- Tabela: usuarios_empresas (vínculo usuário ↔ empresa)
-- Preparada para N:N desde já; MVP usa apenas 1:1 na prática.
-- ----------------------------------------------------------------------------
create table if not exists public.usuarios_empresas (
  id           uuid primary key default gen_random_uuid(),
  usuario_id   uuid not null references auth.users (id) on delete cascade,
  empresa_id   uuid not null references public.empresas (id) on delete cascade,
  papel        text not null default 'admin',
  criado_em    timestamptz not null default now(),
  unique (usuario_id, empresa_id)
);

comment on table public.usuarios_empresas is 'Vínculo entre usuários (auth.users) e empresas. Base do isolamento de dados via RLS.';

create index if not exists idx_usuarios_empresas_usuario_id on public.usuarios_empresas (usuario_id);
create index if not exists idx_usuarios_empresas_empresa_id on public.usuarios_empresas (empresa_id);

-- ----------------------------------------------------------------------------
-- Função: criar_empresa_inicial
-- Cria a empresa e o vínculo usuário-empresa de forma atômica. É chamada
-- pelo formulário de onboarding (Fase 2), nunca pelo cadastro — o cadastro
-- (Fase 1) cria apenas o usuário no Supabase Auth, sem nenhuma empresa.
--
-- SECURITY DEFINER: roda com os privilégios do dono da função (bypassa RLS
-- de forma controlada), mas:
--   - usa auth.uid() internamente para o usuario_id — nunca recebe
--     usuario_id nem empresa_id como parâmetro, então não há como um
--     cliente forjar esses valores ou vincular-se à empresa de outra
--     pessoa;
--   - bloqueia explicitamente chamadas sem sessão (auth.uid() nulo);
--   - bloqueia explicitamente uma segunda chamada bem-sucedida para um
--     usuário que já tenha empresa vinculada — o MVP é 1:1 por usuário.
-- ----------------------------------------------------------------------------
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

  return v_empresa_id;
end;
$$;

comment on function public.criar_empresa_inicial is 'Cria empresa + vínculo usuário-empresa de forma atômica, chamada pelo onboarding (Fase 2). Único caminho suportado para criar uma empresa no MVP; bloqueia usuário sem sessão e usuário que já possui empresa.';

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.empresas enable row level security;
alter table public.usuarios_empresas enable row level security;

-- empresas: só é visível/editável por quem tem vínculo em usuarios_empresas
drop policy if exists "empresas_select_por_vinculo" on public.empresas;
create policy "empresas_select_por_vinculo"
  on public.empresas for select
  using (
    exists (
      select 1 from public.usuarios_empresas ue
      where ue.empresa_id = empresas.id
        and ue.usuario_id = auth.uid()
    )
  );

drop policy if exists "empresas_update_por_vinculo" on public.empresas;
create policy "empresas_update_por_vinculo"
  on public.empresas for update
  using (
    exists (
      select 1 from public.usuarios_empresas ue
      where ue.empresa_id = empresas.id
        and ue.usuario_id = auth.uid()
    )
  );

-- Nenhuma policy de INSERT/DELETE direta é criada para "empresas":
-- a criação só acontece via criar_empresa_inicial() (security definer).
-- Isso evita empresa "órfã" sem vínculo de usuário.

-- usuarios_empresas: cada usuário só vê seus próprios vínculos
drop policy if exists "usuarios_empresas_select_proprio" on public.usuarios_empresas;
create policy "usuarios_empresas_select_proprio"
  on public.usuarios_empresas for select
  using (usuario_id = auth.uid());

-- Nenhuma policy de INSERT/UPDATE/DELETE direta é criada aqui:
-- o vínculo inicial só é criado via criar_empresa_inicial(); edição de papéis
-- (multiempresa com permissões) fica para uma fase futura (fora do MVP).
