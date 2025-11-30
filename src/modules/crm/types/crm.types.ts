/**
 * CRM Domain Types
 * These types represent the domain model for CRM functionality,
 * abstracted from the Supabase database types.
 */

export interface Stage {
  id: string;
  name: string;
  position: number;
  color: string;
  pipelineId: string;
  isWinStage?: boolean;
  isLossStage?: boolean;
  createdAt: string;
}

export interface Pipeline {
  id: string;
  name: string;
  type: 'vendas' | 'pos_venda' | 'assistencia';
  companyId: string;
  stages: Stage[];
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  cpfCnpj?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  origem?: string | null;
  observacoes?: string | null;
  companyId: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  title: string;
  description?: string | null;
  stageId: string;
  pipelineId: string;
  position: number;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  projectId?: string | null;
  responsibleId?: string | null;
  estimatedValue?: number | null;
  finalValue?: number | null;
  expectedCloseDate?: string | null;
  actualCloseDate?: string | null;
  status?: string | null;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  // Joined relations for UI display
  customer?: { name: string } | null;
  project?: { name: string } | null;
  responsible?: { fullName: string } | null;
}

export interface DealInteraction {
  id: string;
  dealId: string;
  userId?: string | null;
  interactionType: string;
  content: string;
  createdAt: string;
  user?: { fullName: string } | null;
}

export interface DealAttachment {
  id: string;
  dealId: string;
  fileUrl: string;
  fileType: string;
  originalFilename?: string | null;
  description?: string | null;
  createdAt: string;
}

// Card type for KanbanBoard (unified interface for deals and service tickets)
export interface KanbanCard {
  id: string;
  title: string;
  description?: string | null;
  stageId: string;
  position: number;
  customers?: { name: string } | null;
  estimatedValue?: number | null;
  priority?: string;
}

// Input types for creating/updating
export interface CreateDealInput {
  title: string;
  customerName: string;
  customerPhone: string;
  description?: string;
  pipelineId: string;
  stageId: string;
}

export interface MoveDealInput {
  dealId: string;
  newStageId: string;
}

export interface CreateCustomerInput {
  name: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  cpfCnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  origem?: string;
  observacoes?: string;
}
