/**
 * Tipos do banco Supabase — schema `public`.
 * GERADO por scripts/gen-types.mjs a partir do OpenAPI do PostgREST. Não editar à mão.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      condominios: {
        Row: {
          id: string
          nome: string
          cnpj: string | null
          endereco: string | null
          cidade: string | null
          uf: string | null
          sindico_nome: string | null
          contato_nome: string | null
          contato_email: string | null
          contato_telefone: string | null
          observacoes: string | null
          created_at: string
          updated_at: string
          administradora: string | null
          agua_preparado: boolean
        }
        Insert: {
          id?: string
          nome: string
          cnpj?: string | null
          endereco?: string | null
          cidade?: string | null
          uf?: string | null
          sindico_nome?: string | null
          contato_nome?: string | null
          contato_email?: string | null
          contato_telefone?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
          administradora?: string | null
          agua_preparado?: boolean
        }
        Update: {
          id?: string
          nome?: string
          cnpj?: string | null
          endereco?: string | null
          cidade?: string | null
          uf?: string | null
          sindico_nome?: string | null
          contato_nome?: string | null
          contato_email?: string | null
          contato_telefone?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
          administradora?: string | null
          agua_preparado?: boolean
        }
        Relationships: [
        ]
      }
      formas_pagamento: {
        Row: {
          id: string
          nome: string
          slug: string
          num_parcelas: number
          usa_preco_de_forma_id: string | null
          ordem: number
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          slug: string
          num_parcelas?: number
          usa_preco_de_forma_id?: string | null
          ordem?: number
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          slug?: string
          num_parcelas?: number
          usa_preco_de_forma_id?: string | null
          ordem?: number
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
        {
          foreignKeyName: "formas_pagamento_usa_preco_de_forma_id_fkey"
          columns: ["usa_preco_de_forma_id"]
          isOneToOne: false
          referencedRelation: "formas_pagamento"
          referencedColumns: ["id"]
        }
        ]
      }
      gerenciamento_mensal: {
        Row: {
          id: string
          orcamento_id: string
          valor_por_hidrometro: number
          qtd_hidrometros: number | null
          valor_total_mensal: number | null
          observacao: string | null
          created_at: string
          updated_at: string
          qtd_apartamentos: number | null
          pontos_por_apartamento: number
        }
        Insert: {
          id?: string
          orcamento_id: string
          valor_por_hidrometro: number
          qtd_hidrometros?: number | null
          valor_total_mensal?: number | null
          observacao?: string | null
          created_at?: string
          updated_at?: string
          qtd_apartamentos?: number | null
          pontos_por_apartamento?: number
        }
        Update: {
          id?: string
          orcamento_id?: string
          valor_por_hidrometro?: number
          qtd_hidrometros?: number | null
          valor_total_mensal?: number | null
          observacao?: string | null
          created_at?: string
          updated_at?: string
          qtd_apartamentos?: number | null
          pontos_por_apartamento?: number
        }
        Relationships: [
        {
          foreignKeyName: "gerenciamento_mensal_orcamento_id_fkey"
          columns: ["orcamento_id"]
          isOneToOne: false
          referencedRelation: "orcamentos"
          referencedColumns: ["id"]
        }
        ]
      }
      historico_alteracoes: {
        Row: {
          id: string
          orcamento_id: string | null
          entidade: string
          entidade_id: string | null
          acao: string
          campo: string | null
          valor_antes: Json | null
          valor_depois: Json | null
          descricao: string | null
          alterado_por: string | null
          alterado_em: string
        }
        Insert: {
          id?: string
          orcamento_id?: string | null
          entidade: string
          entidade_id?: string | null
          acao: string
          campo?: string | null
          valor_antes?: Json | null
          valor_depois?: Json | null
          descricao?: string | null
          alterado_por?: string | null
          alterado_em?: string
        }
        Update: {
          id?: string
          orcamento_id?: string | null
          entidade?: string
          entidade_id?: string | null
          acao?: string
          campo?: string | null
          valor_antes?: Json | null
          valor_depois?: Json | null
          descricao?: string | null
          alterado_por?: string | null
          alterado_em?: string
        }
        Relationships: [
        {
          foreignKeyName: "historico_alteracoes_orcamento_id_fkey"
          columns: ["orcamento_id"]
          isOneToOne: false
          referencedRelation: "orcamentos"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "historico_alteracoes_alterado_por_fkey"
          columns: ["alterado_por"]
          isOneToOne: false
          referencedRelation: "usuarios"
          referencedColumns: ["id"]
        }
        ]
      }
      itens_precificaveis: {
        Row: {
          id: string
          nome: string
          slug: string
          descricao: string | null
          unidade: string
          is_tss: boolean
          ativo: boolean
          ordem: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          slug: string
          descricao?: string | null
          unidade?: string
          is_tss?: boolean
          ativo?: boolean
          ordem?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          slug?: string
          descricao?: string | null
          unidade?: string
          is_tss?: boolean
          ativo?: boolean
          ordem?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
        ]
      }
      modelos_proposta: {
        Row: {
          id: string
          tipo: string
          nome: string
          secoes: Json
          ativo: boolean
          created_at: string
          updated_at: string
          intro: string | null
        }
        Insert: {
          id?: string
          tipo: string
          nome: string
          secoes: Json
          ativo?: boolean
          created_at?: string
          updated_at?: string
          intro?: string | null
        }
        Update: {
          id?: string
          tipo?: string
          nome?: string
          secoes?: Json
          ativo?: boolean
          created_at?: string
          updated_at?: string
          intro?: string | null
        }
        Relationships: [
        ]
      }
      orcamento_valores_congelados: {
        Row: {
          id: string
          orcamento_id: string
          item_id: string
          forma_pagamento_id: string
          valor_unitario: number
          preco_id: string | null
          congelado_em: string
        }
        Insert: {
          id?: string
          orcamento_id: string
          item_id: string
          forma_pagamento_id: string
          valor_unitario: number
          preco_id?: string | null
          congelado_em?: string
        }
        Update: {
          id?: string
          orcamento_id?: string
          item_id?: string
          forma_pagamento_id?: string
          valor_unitario?: number
          preco_id?: string | null
          congelado_em?: string
        }
        Relationships: [
        {
          foreignKeyName: "orcamento_valores_congelados_orcamento_id_fkey"
          columns: ["orcamento_id"]
          isOneToOne: false
          referencedRelation: "orcamentos"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "orcamento_valores_congelados_item_id_fkey"
          columns: ["item_id"]
          isOneToOne: false
          referencedRelation: "itens_precificaveis"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "orcamento_valores_congelados_forma_pagamento_id_fkey"
          columns: ["forma_pagamento_id"]
          isOneToOne: false
          referencedRelation: "formas_pagamento"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "orcamento_valores_congelados_preco_id_fkey"
          columns: ["preco_id"]
          isOneToOne: false
          referencedRelation: "precos"
          referencedColumns: ["id"]
        }
        ]
      }
      orcamentos: {
        Row: {
          id: string
          numero: string
          ano: number
          data_orcamento: string
          condominio_id: string
          template_texto_id: string | null
          status: string
          prazo: string | null
          observacoes: string | null
          total_unidades: number | null
          valor_tss: number | null
          valor_total: number | null
          criado_por: string | null
          atualizado_por: string | null
          created_at: string
          updated_at: string
          incluir_tss: boolean
          parcelas_custom: number[]
          formas_pagamento_visiveis: number[]
          tipo_proposta: string
          qtd_equipamentos: number | null
          tss_opcoes: Json
          medidor_gas: string | null
        }
        Insert: {
          id?: string
          numero: string
          ano: number
          data_orcamento?: string
          condominio_id: string
          template_texto_id?: string | null
          status?: string
          prazo?: string | null
          observacoes?: string | null
          total_unidades?: number | null
          valor_tss?: number | null
          valor_total?: number | null
          criado_por?: string | null
          atualizado_por?: string | null
          created_at?: string
          updated_at?: string
          incluir_tss?: boolean
          parcelas_custom: number[]
          formas_pagamento_visiveis?: number[]
          tipo_proposta?: string
          qtd_equipamentos?: number | null
          tss_opcoes: Json
          medidor_gas?: string | null
        }
        Update: {
          id?: string
          numero?: string
          ano?: number
          data_orcamento?: string
          condominio_id?: string
          template_texto_id?: string | null
          status?: string
          prazo?: string | null
          observacoes?: string | null
          total_unidades?: number | null
          valor_tss?: number | null
          valor_total?: number | null
          criado_por?: string | null
          atualizado_por?: string | null
          created_at?: string
          updated_at?: string
          incluir_tss?: boolean
          parcelas_custom?: number[]
          formas_pagamento_visiveis?: number[]
          tipo_proposta?: string
          qtd_equipamentos?: number | null
          tss_opcoes?: Json
          medidor_gas?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "orcamentos_condominio_id_fkey"
          columns: ["condominio_id"]
          isOneToOne: false
          referencedRelation: "condominios"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "orcamentos_template_texto_id_fkey"
          columns: ["template_texto_id"]
          isOneToOne: false
          referencedRelation: "templates_texto"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "orcamentos_criado_por_fkey"
          columns: ["criado_por"]
          isOneToOne: false
          referencedRelation: "usuarios"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "orcamentos_atualizado_por_fkey"
          columns: ["atualizado_por"]
          isOneToOne: false
          referencedRelation: "usuarios"
          referencedColumns: ["id"]
        }
        ]
      }
      precos: {
        Row: {
          id: string
          item_id: string
          forma_pagamento_id: string
          valor: number
          vigencia_inicio: string
          vigencia_fim: string | null
          criado_por: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_id: string
          forma_pagamento_id: string
          valor: number
          vigencia_inicio: string
          vigencia_fim?: string | null
          criado_por?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          forma_pagamento_id?: string
          valor?: number
          vigencia_inicio?: string
          vigencia_fim?: string | null
          criado_por?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
        {
          foreignKeyName: "precos_item_id_fkey"
          columns: ["item_id"]
          isOneToOne: false
          referencedRelation: "itens_precificaveis"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "precos_forma_pagamento_id_fkey"
          columns: ["forma_pagamento_id"]
          isOneToOne: false
          referencedRelation: "formas_pagamento"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "precos_criado_por_fkey"
          columns: ["criado_por"]
          isOneToOne: false
          referencedRelation: "usuarios"
          referencedColumns: ["id"]
        }
        ]
      }
      templates_texto: {
        Row: {
          id: string
          nome: string
          is_padrao: boolean
          sec_individualizacao_agua: string | null
          sec_analise_agua_preparado: string | null
          sec_analise_agua_nao_preparado: string | null
          sec_objetivo: string | null
          sec_procedimento_tecnico: string | null
          sec_intervencao: string | null
          sec_intervencao_agua_nao_preparado: string | null
          sec_tramites_administrativos: string | null
          sec_gerenciamento_mensal: string | null
          sec_garantia: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          is_padrao?: boolean
          sec_individualizacao_agua?: string | null
          sec_analise_agua_preparado?: string | null
          sec_analise_agua_nao_preparado?: string | null
          sec_objetivo?: string | null
          sec_procedimento_tecnico?: string | null
          sec_intervencao?: string | null
          sec_intervencao_agua_nao_preparado?: string | null
          sec_tramites_administrativos?: string | null
          sec_gerenciamento_mensal?: string | null
          sec_garantia?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          is_padrao?: boolean
          sec_individualizacao_agua?: string | null
          sec_analise_agua_preparado?: string | null
          sec_analise_agua_nao_preparado?: string | null
          sec_objetivo?: string | null
          sec_procedimento_tecnico?: string | null
          sec_intervencao?: string | null
          sec_intervencao_agua_nao_preparado?: string | null
          sec_tramites_administrativos?: string | null
          sec_gerenciamento_mensal?: string | null
          sec_garantia?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
        ]
      }
      tipo_apartamento_itens: {
        Row: {
          id: string
          tipo_apartamento_id: string
          item_id: string
          quantidade: number
          ordem: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tipo_apartamento_id: string
          item_id: string
          quantidade: number
          ordem?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tipo_apartamento_id?: string
          item_id?: string
          quantidade?: number
          ordem?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
        {
          foreignKeyName: "tipo_apartamento_itens_tipo_apartamento_id_fkey"
          columns: ["tipo_apartamento_id"]
          isOneToOne: false
          referencedRelation: "tipos_apartamento"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "tipo_apartamento_itens_item_id_fkey"
          columns: ["item_id"]
          isOneToOne: false
          referencedRelation: "itens_precificaveis"
          referencedColumns: ["id"]
        }
        ]
      }
      tipos_apartamento: {
        Row: {
          id: string
          orcamento_id: string
          nome: string
          unidades: number
          ordem: number
          valor_por_apartamento: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          orcamento_id: string
          nome: string
          unidades: number
          ordem?: number
          valor_por_apartamento?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          orcamento_id?: string
          nome?: string
          unidades?: number
          ordem?: number
          valor_por_apartamento?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
        {
          foreignKeyName: "tipos_apartamento_orcamento_id_fkey"
          columns: ["orcamento_id"]
          isOneToOne: false
          referencedRelation: "orcamentos"
          referencedColumns: ["id"]
        }
        ]
      }
      usuarios: {
        Row: {
          id: string
          nome: string
          email: string
          perfil: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nome: string
          email: string
          perfil?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          perfil?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aplicar_tabela_precos: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      salvar_montagem_orcamento: {
        Args: Record<string, unknown>
        Returns: undefined
      }
      rls_auto_enable: {
        Args: Record<string, unknown>
        Returns: unknown
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
