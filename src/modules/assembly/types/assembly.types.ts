// Assembly Module Types
// Types for assembly orders and related functionality

export type AssemblyStatus = 'agendada' | 'em_andamento' | 'concluida';

export interface AssemblyOrder {
  id: string;
  project_id: string;
  deal_id: string | null;
  montador_id: string | null;
  scheduled_date: string | null;
  status: string;
  observations: string | null;
  material_request: string | null;
  assembly_value: number | null;
  company_id: string;
  created_at: string;
  updated_at: string;
  // Relations
  projects?: { name: string; customer_id: string } | null;
  deals?: { title: string } | null;
  profiles?: { full_name: string } | null;
}

export interface CreateAssemblyOrderInput {
  project_id: string;
  deal_id?: string;
  montador_id?: string;
  scheduled_date?: string;
  status?: AssemblyStatus;
  observations?: string;
  material_request?: string;
  assembly_value?: number;
}

export interface UpdateAssemblyOrderInput {
  montador_id?: string;
  scheduled_date?: string;
  status?: AssemblyStatus;
  observations?: string;
  material_request?: string;
  assembly_value?: number;
}

export interface FinalInspection {
  id: string;
  assembly_order_id: string;
  customer_name: string;
  approved: boolean;
  observations: string | null;
  signature_url: string | null;
  created_at: string;
}

export interface CreateInspectionInput {
  assembly_order_id: string;
  customer_name: string;
  approved: boolean;
  observations?: string;
  signature_url?: string;
}
