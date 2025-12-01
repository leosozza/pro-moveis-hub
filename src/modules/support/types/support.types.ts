/**
 * Support Domain Types
 * These types represent the domain model for support/service tickets functionality.
 */

export interface ServiceTicket {
  id: string;
  title: string;
  description: string;
  stageId: string;
  pipelineId: string;
  position: number;
  customerId: string;
  projectId?: string | null;
  responsibleId?: string | null;
  priority?: string | null;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  // Joined relations for UI display
  customer?: { name: string } | null;
  project?: { name: string } | null;
  responsible?: { fullName: string } | null;
}

// Card type for KanbanBoard (compatible with deals card format)
export interface TicketKanbanCard {
  id: string;
  title: string;
  description?: string | null;
  stageId: string;
  position: number;
  customers?: { name: string } | null;
  priority?: string;
}

// Legacy card format for backward compatibility with KanbanBoard (snake_case)
export interface LegacyTicketCard {
  id: string;
  title: string;
  description?: string | null;
  stage_id: string;
  position: number;
  customers?: { name: string } | null;
  priority?: string;
}

// Input types for creating/updating
export interface CreateTicketInput {
  title: string;
  description: string;
  customerId: string;
  projectId?: string;
  stageId: string;
  priority?: string;
}

export interface MoveTicketInput {
  ticketId: string;
  newStageId: string;
}
