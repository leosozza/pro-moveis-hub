// CRM Domain Types
// These types represent the domain entities used across CRM modules

export type PipelineType = 'vendas' | 'pos_venda' | 'assistencia';

export interface Stage {
  id: string;
  name: string;
  position: number;
  color: string | null;
  pipeline_id: string;
  is_win_stage: boolean | null;
  is_loss_stage: boolean | null;
  created_at: string;
}

export interface Pipeline {
  id: string;
  name: string;
  type: string;
  company_id: string;
  stages?: Stage[];
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  title: string;
  description: string | null;
  stage_id: string;
  pipeline_id: string;
  position: number;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  project_id: string | null;
  responsible_id: string | null;
  estimated_value: number | null;
  final_value: number | null;
  expected_close_date: string | null;
  actual_close_date: string | null;
  status: string | null;
  company_id: string;
  created_at: string;
  updated_at: string;
  // Relations
  customers?: { name: string } | null;
  projects?: { name: string } | null;
  profiles?: { full_name: string } | null;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  cpf_cnpj: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  observacoes: string | null;
  origem: string | null;
  company_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Input types for mutations
export interface CreateDealInput {
  title: string;
  description?: string;
  stage_id: string;
  pipeline_id: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  project_id?: string;
  responsible_id?: string;
  estimated_value?: number;
  expected_close_date?: string;
}

export interface UpdateDealInput {
  title?: string;
  description?: string;
  stage_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  project_id?: string;
  responsible_id?: string;
  estimated_value?: number;
  final_value?: number;
  expected_close_date?: string;
  actual_close_date?: string;
  status?: string;
}

export interface CreatePipelineInput {
  name: string;
  type: PipelineType;
}

export interface UpdatePipelineInput {
  name?: string;
}

export interface CreateStageInput {
  name: string;
  pipeline_id: string;
  position: number;
  color?: string;
  is_win_stage?: boolean;
  is_loss_stage?: boolean;
}

export interface UpdateStageInput {
  name?: string;
  position?: number;
  color?: string;
  is_win_stage?: boolean;
  is_loss_stage?: boolean;
}

export interface CreateCustomerInput {
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  cpf_cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  observacoes?: string;
  origem?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  cpf_cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  observacoes?: string;
  origem?: string;
}

// Kanban card type that can be used by any Kanban-compatible entity
export interface KanbanCard {
  id: string;
  title: string;
  description?: string | null;
  stage_id: string;
  position: number;
  customers?: { name: string } | null;
  estimated_value?: number | null;
  priority?: string;
}
