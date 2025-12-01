// CRM Module Types - Shared type definitions for CRM hooks

export interface Stage {
  id: string;
  name: string;
  position: number;
  color: string | null;
  is_win_stage?: boolean | null;
  is_loss_stage?: boolean | null;
  pipeline_id: string;
  created_at: string;
}

export type PipelineType = 'vendas' | 'pos_venda' | 'assistencia';

export interface Pipeline {
  id: string;
  name: string;
  type: string;
  company_id: string;
  created_at: string;
  updated_at: string;
  stages?: Stage[];
}

export interface Deal {
  id: string;
  title: string;
  description?: string | null;
  stage_id: string;
  pipeline_id: string;
  position: number;
  customer_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  estimated_value?: number | null;
  final_value?: number | null;
  expected_close_date?: string | null;
  actual_close_date?: string | null;
  status?: string | null;
  project_id?: string | null;
  responsible_id?: string | null;
  company_id: string;
  created_at: string;
  updated_at: string;
  customers?: { name: string } | null;
}

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  cpf_cnpj?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  origem?: string | null;
  observacoes?: string | null;
  company_id: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDealInput {
  title: string;
  description?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_id?: string;
  estimated_value?: number;
  expected_close_date?: string;
}
