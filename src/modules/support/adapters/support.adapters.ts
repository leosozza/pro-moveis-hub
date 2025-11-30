/**
 * Support Adapters
 * Functions to transform Supabase row types to domain types.
 */

import type { Tables } from '@/integrations/supabase/types';
import type { ServiceTicket, TicketKanbanCard, LegacyTicketCard } from '../types/support.types';

type ServiceTicketRowWithRelations = Tables<'service_tickets'> & {
  customers?: { name: string } | null;
  projects?: { name: string } | null;
  profiles?: { full_name: string } | null;
};

export const mapServiceTicketRowToTicket = (row: ServiceTicketRowWithRelations): ServiceTicket => ({
  id: row.id,
  title: row.title,
  description: row.description,
  stageId: row.stage_id,
  pipelineId: row.pipeline_id,
  position: row.position,
  customerId: row.customer_id,
  projectId: row.project_id,
  responsibleId: row.responsible_id,
  priority: row.priority,
  companyId: row.company_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  customer: row.customers ? { name: row.customers.name } : null,
  project: row.projects ? { name: row.projects.name } : null,
  responsible: row.profiles ? { fullName: row.profiles.full_name } : null,
});

export const mapTicketToKanbanCard = (ticket: ServiceTicket): TicketKanbanCard => ({
  id: ticket.id,
  title: ticket.title,
  description: ticket.description,
  stageId: ticket.stageId,
  position: ticket.position,
  customers: ticket.customer,
  priority: ticket.priority ?? undefined,
});

// Adapter for legacy KanbanBoard format (maps back to snake_case for compatibility)
export const mapTicketToLegacyCard = (ticket: ServiceTicket): LegacyTicketCard => ({
  id: ticket.id,
  title: ticket.title,
  description: ticket.description,
  stage_id: ticket.stageId,
  position: ticket.position,
  customers: ticket.customer,
  priority: ticket.priority ?? undefined,
});
