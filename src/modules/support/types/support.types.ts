// Support Module Types
// Types for service tickets and support functionality

export type TicketPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export interface ServiceTicket {
  id: string;
  title: string;
  description: string;
  stage_id: string;
  pipeline_id: string;
  position: number;
  customer_id: string;
  project_id: string | null;
  responsible_id: string | null;
  priority: TicketPriority | null;
  company_id: string;
  created_at: string;
  updated_at: string;
  // Relations
  customers?: { name: string } | null;
  projects?: { name: string } | null;
  profiles?: { full_name: string } | null;
}

export interface CreateTicketInput {
  title: string;
  description: string;
  stage_id: string;
  pipeline_id: string;
  customer_id: string;
  project_id?: string;
  responsible_id?: string;
  priority?: TicketPriority;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  stage_id?: string;
  customer_id?: string;
  project_id?: string;
  responsible_id?: string;
  priority?: TicketPriority;
}
