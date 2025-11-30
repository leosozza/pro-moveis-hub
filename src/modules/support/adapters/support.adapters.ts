// Support Module Adapters
// Functions to map database rows to domain types

import type { Tables } from '@/integrations/supabase/types';
import type { ServiceTicket } from '../types/support.types';

type TicketRow = Tables<'service_tickets'>;

export function mapTicketRowToTicket(row: TicketRow & {
  customers?: { name: string } | null;
  projects?: { name: string } | null;
  profiles?: { full_name: string } | null;
}): ServiceTicket {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    stage_id: row.stage_id,
    pipeline_id: row.pipeline_id,
    position: row.position,
    customer_id: row.customer_id,
    project_id: row.project_id,
    responsible_id: row.responsible_id,
    priority: row.priority,
    company_id: row.company_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    customers: row.customers,
    projects: row.projects,
    profiles: row.profiles,
  };
}
