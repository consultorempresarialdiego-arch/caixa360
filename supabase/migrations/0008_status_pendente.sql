-- ============================================================================
-- CAIXA360 — Migration 0008: Status "pendente" para empresas novas
-- A partir de agora, toda empresa criada nasce com status "pendente"
-- (aguardando confirmação manual de pagamento) em vez de "acesso_antecipado"
-- — esse status fica reservado para o criador do sistema. A confirmação de
-- pagamento (por enquanto manual, fora do banco) muda o status para "ativa".
--
-- Esta migration é ADITIVA — não altera nenhuma empresa/assinatura já
-- existente (inclusive a sua, que permanece "acesso_antecipado"), e não
-- mexe nas migrations 0001-0007. Só muda o valor inicial de empresas
-- criadas DAQUI PRA FRENTE.
-- ============================================================================

alter table public.assinaturas drop constraint if exists assinaturas_status_check;

do $$
begin
  alter table public.assinaturas
    add constraint assinaturas_status_check
    check (status in ('pendente', 'acesso_antecipado', 'ativa', 'pausada', 'cancelada'));
exception
  when duplicate_object then null;
end $$;

-- criar_empresa_inicial() passa a criar a assinatura como "pendente" — corpo
-- idêntico ao da migration 0006, só com o status inicial trocado.
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
  values (v_empresa_id, 'pendente', now());

  return v_empresa_id;
end;
$$;

comment on function public.criar_empresa_inicial is 'Cria empresa + vínculo usuário-empresa + assinatura (status pendente, aguardando confirmação manual de pagamento) de forma atômica, chamada pelo onboarding (Fase 2). Único caminho suportado para criar uma empresa no MVP.';
