export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assembly_orders: {
        Row: {
          assembly_value: number | null
          company_id: string
          created_at: string
          deal_id: string | null
          id: string
          material_request: string | null
          montador_id: string | null
          observations: string | null
          project_id: string
          scheduled_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assembly_value?: number | null
          company_id: string
          created_at?: string
          deal_id?: string | null
          id?: string
          material_request?: string | null
          montador_id?: string | null
          observations?: string | null
          project_id: string
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assembly_value?: number | null
          company_id?: string
          created_at?: string
          deal_id?: string | null
          id?: string
          material_request?: string | null
          montador_id?: string | null
          observations?: string | null
          project_id?: string
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assembly_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assembly_orders_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assembly_orders_montador_id_fkey"
            columns: ["montador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assembly_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      assembly_photos: {
        Row: {
          assembly_order_id: string
          created_at: string
          description: string | null
          id: string
          photo_url: string
        }
        Insert: {
          assembly_order_id: string
          created_at?: string
          description?: string | null
          id?: string
          photo_url: string
        }
        Update: {
          assembly_order_id?: string
          created_at?: string
          description?: string | null
          id?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "assembly_photos_assembly_order_id_fkey"
            columns: ["assembly_order_id"]
            isOneToOne: false
            referencedRelation: "assembly_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          altura_mm: number | null
          ambiente: string
          area_m2: number | null
          budget_id: string
          created_at: string
          custo_total: number | null
          custo_unitario: number | null
          descricao: string
          espessura: string | null
          id: string
          largura_mm: number | null
          material: string | null
          modelo: string | null
          preco_total: number | null
          preco_unitario: number | null
          profundidade_mm: number | null
          promob_file_id: string | null
          quantidade: number | null
          referencia: string | null
          sem_preco: boolean | null
          tipo_item: string | null
        }
        Insert: {
          altura_mm?: number | null
          ambiente: string
          area_m2?: number | null
          budget_id: string
          created_at?: string
          custo_total?: number | null
          custo_unitario?: number | null
          descricao: string
          espessura?: string | null
          id?: string
          largura_mm?: number | null
          material?: string | null
          modelo?: string | null
          preco_total?: number | null
          preco_unitario?: number | null
          profundidade_mm?: number | null
          promob_file_id?: string | null
          quantidade?: number | null
          referencia?: string | null
          sem_preco?: boolean | null
          tipo_item?: string | null
        }
        Update: {
          altura_mm?: number | null
          ambiente?: string
          area_m2?: number | null
          budget_id?: string
          created_at?: string
          custo_total?: number | null
          custo_unitario?: number | null
          descricao?: string
          espessura?: string | null
          id?: string
          largura_mm?: number | null
          material?: string | null
          modelo?: string | null
          preco_total?: number | null
          preco_unitario?: number | null
          profundidade_mm?: number | null
          promob_file_id?: string | null
          quantidade?: number | null
          referencia?: string | null
          sem_preco?: boolean | null
          tipo_item?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_promob_file_id_fkey"
            columns: ["promob_file_id"]
            isOneToOne: false
            referencedRelation: "promob_files"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          observacoes: string | null
          project_id: string
          total_custo: number | null
          total_preco: number | null
          updated_at: string
          version: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          observacoes?: string | null
          project_id: string
          total_custo?: number | null
          total_preco?: number | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          observacoes?: string | null
          project_id?: string
          total_custo?: number | null
          total_preco?: number | null
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          margem_padrao_chapa: number | null
          margem_padrao_ferragem: number | null
          name: string
          perda_chapa_percentual: number | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          margem_padrao_chapa?: number | null
          margem_padrao_ferragem?: number | null
          name: string
          perda_chapa_percentual?: number | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          margem_padrao_chapa?: number | null
          margem_padrao_ferragem?: number | null
          name?: string
          perda_chapa_percentual?: number | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          company_id: string
          cpf_cnpj: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          observacoes: string | null
          origem: string | null
          phone: string | null
          state: string | null
          updated_at: string
          whatsapp: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_id: string
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          observacoes?: string | null
          origem?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          whatsapp?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_id?: string
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          observacoes?: string | null
          origem?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          whatsapp?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          actual_close_date: string | null
          company_id: string
          created_at: string
          customer_id: string
          description: string | null
          estimated_value: number | null
          expected_close_date: string | null
          final_value: number | null
          id: string
          pipeline_id: string
          position: number
          project_id: string | null
          responsible_id: string | null
          stage_id: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_close_date?: string | null
          company_id: string
          created_at?: string
          customer_id: string
          description?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          final_value?: number | null
          id?: string
          pipeline_id: string
          position?: number
          project_id?: string | null
          responsible_id?: string | null
          stage_id: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_close_date?: string | null
          company_id?: string
          created_at?: string
          customer_id?: string
          description?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          final_value?: number | null
          id?: string
          pipeline_id?: string
          position?: number
          project_id?: string | null
          responsible_id?: string | null
          stage_id?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      final_inspections: {
        Row: {
          approved: boolean
          assembly_order_id: string
          created_at: string
          customer_name: string
          id: string
          observations: string | null
          signature_url: string | null
        }
        Insert: {
          approved: boolean
          assembly_order_id: string
          created_at?: string
          customer_name: string
          id?: string
          observations?: string | null
          signature_url?: string | null
        }
        Update: {
          approved?: boolean
          assembly_order_id?: string
          created_at?: string
          customer_name?: string
          id?: string
          observations?: string | null
          signature_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "final_inspections_assembly_order_id_fkey"
            columns: ["assembly_order_id"]
            isOneToOne: false
            referencedRelation: "assembly_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      hardware_prices: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          preco_unitario: number
          price_table_id: string
          referencia: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          preco_unitario: number
          price_table_id: string
          referencia: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          preco_unitario?: number
          price_table_id?: string
          referencia?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hardware_prices_price_table_id_fkey"
            columns: ["price_table_id"]
            isOneToOne: false
            referencedRelation: "price_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      margin_rules: {
        Row: {
          ambiente: string | null
          company_id: string
          created_at: string
          id: string
          margem_percentual: number
          tipo_cliente: string | null
          tipo_item: string
          updated_at: string
        }
        Insert: {
          ambiente?: string | null
          company_id: string
          created_at?: string
          id?: string
          margem_percentual: number
          tipo_cliente?: string | null
          tipo_item: string
          updated_at?: string
        }
        Update: {
          ambiente?: string | null
          company_id?: string
          created_at?: string
          id?: string
          margem_percentual?: number
          tipo_cliente?: string | null
          tipo_item?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "margin_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      price_tables: {
        Row: {
          active: boolean | null
          company_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          company_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_tables_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id: string
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          company_id: string
          created_at: string
          customer_id: string
          description: string | null
          id: string
          name: string
          projetista_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          name: string
          projetista_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          name?: string
          projetista_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_projetista_id_fkey"
            columns: ["projetista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promob_files: {
        Row: {
          ambiente: string
          company_id: string
          created_at: string
          customer_id: string
          file_path: string
          file_type: string | null
          id: string
          original_filename: string
          project_id: string
          uploaded_by: string | null
        }
        Insert: {
          ambiente: string
          company_id: string
          created_at?: string
          customer_id: string
          file_path: string
          file_type?: string | null
          id?: string
          original_filename: string
          project_id: string
          uploaded_by?: string | null
        }
        Update: {
          ambiente?: string
          company_id?: string
          created_at?: string
          customer_id?: string
          file_path?: string
          file_type?: string | null
          id?: string
          original_filename?: string
          project_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promob_files_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promob_files_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promob_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promob_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_ticket_photos: {
        Row: {
          created_at: string
          id: string
          photo_url: string
          service_ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_url: string
          service_ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_url?: string
          service_ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_ticket_photos_service_ticket_id_fkey"
            columns: ["service_ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      service_tickets: {
        Row: {
          company_id: string
          created_at: string
          customer_id: string
          description: string
          id: string
          pipeline_id: string
          position: number
          priority: string | null
          project_id: string | null
          responsible_id: string | null
          stage_id: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          customer_id: string
          description: string
          id?: string
          pipeline_id: string
          position?: number
          priority?: string | null
          project_id?: string | null
          responsible_id?: string | null
          stage_id: string
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          customer_id?: string
          description?: string
          id?: string
          pipeline_id?: string
          position?: number
          priority?: string | null
          project_id?: string | null
          responsible_id?: string | null
          stage_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_tickets_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_tickets_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_tickets_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_prices: {
        Row: {
          created_at: string
          espessura: string
          id: string
          marca: string | null
          material: string
          preco_m2: number
          price_table_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          espessura: string
          id?: string
          marca?: string | null
          material: string
          preco_m2: number
          price_table_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          espessura?: string
          id?: string
          marca?: string | null
          material?: string
          preco_m2?: number
          price_table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheet_prices_price_table_id_fkey"
            columns: ["price_table_id"]
            isOneToOne: false
            referencedRelation: "price_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      stages: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          pipeline_id: string
          position: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          pipeline_id: string
          position: number
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          pipeline_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xml_comparisons: {
        Row: {
          cost_difference: number
          cost_difference_percent: number
          created_at: string
          executivo_snapshot_id: string
          id: string
          project_id: string
          vendido_snapshot_id: string
        }
        Insert: {
          cost_difference?: number
          cost_difference_percent?: number
          created_at?: string
          executivo_snapshot_id: string
          id?: string
          project_id: string
          vendido_snapshot_id: string
        }
        Update: {
          cost_difference?: number
          cost_difference_percent?: number
          created_at?: string
          executivo_snapshot_id?: string
          id?: string
          project_id?: string
          vendido_snapshot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xml_comparisons_executivo_snapshot_id_fkey"
            columns: ["executivo_snapshot_id"]
            isOneToOne: false
            referencedRelation: "xml_cost_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xml_comparisons_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xml_comparisons_vendido_snapshot_id_fkey"
            columns: ["vendido_snapshot_id"]
            isOneToOne: false
            referencedRelation: "xml_cost_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      xml_cost_snapshots: {
        Row: {
          created_at: string
          file_type: string
          id: string
          promob_file_id: string
          total_cost: number
          total_items: number
        }
        Insert: {
          created_at?: string
          file_type: string
          id?: string
          promob_file_id: string
          total_cost?: number
          total_items?: number
        }
        Update: {
          created_at?: string
          file_type?: string
          id?: string
          promob_file_id?: string
          total_cost?: number
          total_items?: number
        }
        Relationships: [
          {
            foreignKeyName: "xml_cost_snapshots_promob_file_id_fkey"
            columns: ["promob_file_id"]
            isOneToOne: false
            referencedRelation: "promob_files"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role:
        | "admin"
        | "projetista"
        | "vendedor"
        | "pos_venda"
        | "montador"
        | "assistencia"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: [
        "admin",
        "projetista",
        "vendedor",
        "pos_venda",
        "montador",
        "assistencia",
      ],
    },
  },
} as const
