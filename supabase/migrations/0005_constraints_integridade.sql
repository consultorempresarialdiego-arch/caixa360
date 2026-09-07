-- ============================================================================
-- CAIXA360 — Migration 0005: Constraints de integridade (Fase 9, Bloco 2)
-- Adiciona duas checagens de integridade financeira diretamente no banco —
-- hoje só a validação da aplicação impedia isso; uma chamada direta à API
-- do Supabase (fora da UI) não era barrada.
--
-- Verificado antes desta migration: 0 registros em produção/teste violam
-- qualquer uma das duas regras (consultas de verificação rodadas no SQL
-- Editor, ambas "Success. No rows returned").
--
-- Esta migration é ADITIVA — não altera nem apaga nada das migrations
-- 0001-0004, não cria tabela nova, só reforça regras que a aplicação já
-- respeitava.
-- ============================================================================

-- empresas.caixa_minimo nunca pode ser negativo (nulo continua significando
-- "usuário ainda não definiu" — ver comentário da coluna na migration 0001).
do $$
begin
  alter table public.empresas
    add constraint caixa_minimo_nao_negativo check (caixa_minimo is null or caixa_minimo >= 0);
exception
  when duplicate_object then null;
end $$;

-- lancamentos.data_pagamento_recebimento só pode existir quando o status é
-- "pago" ou "recebido", e é obrigatória nesses dois casos — nunca ambígua
-- em relação ao status. Isso é o que garante que o Fluxo de Caixa (que usa
-- essa coluna como âncora) e o saldo atual do Dashboard nunca leem um
-- lançamento com data de movimentação indefinida ou contraditória.
do $$
begin
  alter table public.lancamentos
    add constraint data_pagamento_coerente_com_status check (
      (status in ('pago', 'recebido')) = (data_pagamento_recebimento is not null)
    );
exception
  when duplicate_object then null;
end $$;
