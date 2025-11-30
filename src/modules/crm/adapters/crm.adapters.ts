/**
 * CRM Adapters
 * Functions to transform Supabase row types to domain types and vice versa.
 */

import type { Tables } from '@/integrations/supabase/types';
import type { 
  Stage, 
  Pipeline, 
  Deal, 
  Customer, 
  DealInteraction, 
  DealAttachment,
  KanbanCard 
} from '../types/crm.types';

// Stage adapters
export const mapStageRowToStage = (row: Tables<'stages'>): Stage => ({
  id: row.id,
  name: row.name,
  position: row.position,
  color: row.color || '#6b7280',
  pipelineId: row.pipeline_id,
  isWinStage: row.is_win_stage ?? false,
  isLossStage: row.is_loss_stage ?? false,
  createdAt: row.created_at,
});

export const mapStagesToSorted = (stages: Tables<'stages'>[]): Stage[] => {
  return stages
    .map(mapStageRowToStage)
    .sort((a, b) => a.position - b.position);
};

// Pipeline adapters
export const mapPipelineRowToPipeline = (
  row: Tables<'pipelines'> & { stages?: Tables<'stages'>[] }
): Pipeline => ({
  id: row.id,
  name: row.name,
  type: row.type as Pipeline['type'],
  companyId: row.company_id,
  stages: row.stages ? mapStagesToSorted(row.stages) : [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Customer adapters
export const mapCustomerRowToCustomer = (row: Tables<'customers'>): Customer => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  whatsapp: row.whatsapp,
  cpfCnpj: row.cpf_cnpj,
  address: row.address,
  city: row.city,
  state: row.state,
  zipCode: row.zip_code,
  origem: row.origem,
  observacoes: row.observacoes,
  companyId: row.company_id,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Deal adapters
type DealRowWithRelations = Tables<'deals'> & {
  customers?: { name: string } | null;
  projects?: { name: string } | null;
  profiles?: { full_name: string } | null;
};

export const mapDealRowToDeal = (row: DealRowWithRelations): Deal => ({
  id: row.id,
  title: row.title,
  description: row.description,
  stageId: row.stage_id,
  pipelineId: row.pipeline_id,
  position: row.position,
  customerId: row.customer_id,
  customerName: row.customer_name,
  customerPhone: row.customer_phone,
  projectId: row.project_id,
  responsibleId: row.responsible_id,
  estimatedValue: row.estimated_value,
  finalValue: row.final_value,
  expectedCloseDate: row.expected_close_date,
  actualCloseDate: row.actual_close_date,
  status: row.status,
  companyId: row.company_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  customer: row.customers ? { name: row.customers.name } : null,
  project: row.projects ? { name: row.projects.name } : null,
  responsible: row.profiles ? { fullName: row.profiles.full_name } : null,
});

// Map deals to KanbanCard format for generic KanbanBoard
export const mapDealToKanbanCard = (deal: Deal): KanbanCard => ({
  id: deal.id,
  title: deal.title,
  description: deal.description,
  stageId: deal.stageId,
  position: deal.position,
  customers: deal.customer || (deal.customerName ? { name: deal.customerName } : null),
  estimatedValue: deal.estimatedValue,
});

// Deal interaction adapters
type DealInteractionRowWithRelations = Tables<'deal_interactions'> & {
  profiles?: { full_name: string } | null;
};

export const mapDealInteractionRowToInteraction = (
  row: DealInteractionRowWithRelations
): DealInteraction => ({
  id: row.id,
  dealId: row.deal_id,
  userId: row.user_id,
  interactionType: row.interaction_type,
  content: row.content,
  createdAt: row.created_at,
  user: row.profiles ? { fullName: row.profiles.full_name } : null,
});

// Deal attachment adapters
export const mapDealAttachmentRowToAttachment = (
  row: Tables<'deal_attachments'>
): DealAttachment => ({
  id: row.id,
  dealId: row.deal_id,
  fileUrl: row.file_url,
  fileType: row.file_type,
  originalFilename: row.original_filename,
  description: row.description,
  createdAt: row.created_at,
});

// Adapter for legacy KanbanBoard format (maps back to snake_case for compatibility)
export const mapDealToLegacyCard = (deal: Deal): {
  id: string;
  title: string;
  description?: string | null;
  stage_id: string;
  position: number;
  customers?: { name: string } | null;
  estimated_value?: number | null;
  priority?: string;
  customer_name?: string | null;
} => ({
  id: deal.id,
  title: deal.title,
  description: deal.description,
  stage_id: deal.stageId,
  position: deal.position,
  customers: deal.customer || (deal.customerName ? { name: deal.customerName } : null),
  estimated_value: deal.estimatedValue,
  customer_name: deal.customerName,
});

// Map Stage to legacy format for KanbanBoard compatibility
export const mapStageToLegacy = (stage: Stage): {
  id: string;
  name: string;
  position: number;
  color: string;
} => ({
  id: stage.id,
  name: stage.name,
  position: stage.position,
  color: stage.color,
});
