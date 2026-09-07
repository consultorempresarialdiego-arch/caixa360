/**
 * Tipos do banco de dados — gerados manualmente.
 * Fase 1: empresas, usuarios_empresas. Fase 3: categorias, lancamentos.
 * Fase 8: importacoes (log de auditoria). Fase 10.3: assinaturas (status comercial).
 */
export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string;
          nome: string;
          setor: string | null;
          saldo_atual: number;
          caixa_minimo: number | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          nome: string;
          setor?: string | null;
          saldo_atual?: number;
          caixa_minimo?: number | null;
          criado_em?: string;
        };
        Update: Partial<{
          nome: string;
          setor: string | null;
          saldo_atual: number;
          caixa_minimo: number | null;
        }>;
        Relationships: [];
      };
      usuarios_empresas: {
        Row: {
          id: string;
          usuario_id: string;
          empresa_id: string;
          papel: string;
          criado_em: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          empresa_id: string;
          papel?: string;
          criado_em?: string;
        };
        Update: Partial<{
          papel: string;
        }>;
        Relationships: [];
      };
      categorias: {
        Row: {
          id: string;
          empresa_id: string | null;
          nome: string;
          tipo: "receita" | "despesa";
          criado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id?: string | null;
          nome: string;
          tipo: "receita" | "despesa";
          criado_em?: string;
        };
        Update: Partial<{
          nome: string;
          tipo: "receita" | "despesa";
        }>;
        Relationships: [];
      };
      lancamentos: {
        Row: {
          id: string;
          empresa_id: string;
          tipo: "pagar" | "receber";
          cliente_fornecedor: string;
          descricao: string;
          categoria_id: string | null;
          vencimento: string;
          valor: number;
          status: string;
          data_pagamento_recebimento: string | null;
          observacao: string | null;
          origem: "manual" | "importado";
          criado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          tipo: "pagar" | "receber";
          cliente_fornecedor: string;
          descricao: string;
          categoria_id?: string | null;
          vencimento: string;
          valor: number;
          status?: string;
          data_pagamento_recebimento?: string | null;
          observacao?: string | null;
          origem?: "manual" | "importado";
          criado_em?: string;
        };
        Update: Partial<{
          cliente_fornecedor: string;
          descricao: string;
          categoria_id: string | null;
          vencimento: string;
          valor: number;
          status: string;
          data_pagamento_recebimento: string | null;
          observacao: string | null;
        }>;
        Relationships: [];
      };
      importacoes: {
        Row: {
          id: string;
          empresa_id: string;
          usuario_id: string;
          arquivo_nome: string;
          formato: "xlsx" | "csv";
          status: "concluida" | "falhou";
          total_linhas: number;
          linhas_importadas: number;
          linhas_ignoradas: number;
          duplicidades_identificadas: number;
          criado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          usuario_id: string;
          arquivo_nome: string;
          formato: "xlsx" | "csv";
          status: "concluida" | "falhou";
          total_linhas?: number;
          linhas_importadas?: number;
          linhas_ignoradas?: number;
          duplicidades_identificadas?: number;
          criado_em?: string;
        };
        Update: Partial<{
          status: "concluida" | "falhou";
          total_linhas: number;
          linhas_importadas: number;
          linhas_ignoradas: number;
          duplicidades_identificadas: number;
        }>;
        Relationships: [];
      };
      assinaturas: {
        Row: {
          id: string;
          empresa_id: string;
          status: "acesso_antecipado" | "ativa" | "pausada" | "cancelada";
          inicio_em: string;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          status: "acesso_antecipado" | "ativa" | "pausada" | "cancelada";
          inicio_em: string;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<{
          status: "acesso_antecipado" | "ativa" | "pausada" | "cancelada";
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      criar_empresa_inicial: {
        Args: {
          p_nome: string;
          p_setor: string | null;
          p_saldo_atual: number;
          p_caixa_minimo: number | null;
        };
        Returns: string;
      };
    };
  };
}
