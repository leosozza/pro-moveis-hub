// CRM Adapters
// Functions to map database rows to domain types

import type { Tables } from '@/integrations/supabase/types';
import type { Deal, Pipeline, Stage, Customer } from '../types/crm.types';

type DealRow = Tables<'deals'>;
type PipelineRow = Tables<'pipelines'>;
type StageRow = Tables<'stages'>;
type CustomerRow = Tables<'customers'>;

export function mapDealRowToDeal(row: DealRow & {
  customers?: { name: string } | null;
  projects?: { name: string } | null;
  profiles?: { full_name: string } | null;
}): Deal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    stage_id: row.stage_id,
    pipeline_id: row.pipeline_id,
    position: row.position,
    customer_id: row.customer_id,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    project_id: row.project_id,
    responsible_id: row.responsible_id,
    estimated_value: row.estimated_value,
    final_value: row.final_value,
    expected_close_date: row.expected_close_date,
    actual_close_date: row.actual_close_date,
    status: row.status,
    company_id: row.company_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    customers: row.customers,
    projects: row.projects,
    profiles: row.profiles,
  };
}

export function mapStageRowToStage(row: StageRow): Stage {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    color: row.color,
    pipeline_id: row.pipeline_id,
    is_win_stage: row.is_win_stage,
    is_loss_stage: row.is_loss_stage,
    created_at: row.created_at,
  };
}

export function mapPipelineRowToPipeline(row: PipelineRow & { stages?: StageRow[] }): Pipeline {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    company_id: row.company_id,
    stages: row.stages?.map(mapStageRowToStage),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapCustomerRowToCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    whatsapp: row.whatsapp,
    cpf_cnpj: row.cpf_cnpj,
    address: row.address,
    city: row.city,
    state: row.state,
    zip_code: row.zip_code,
    observacoes: row.observacoes,
    origem: row.origem,
    company_id: row.company_id,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
