// Assembly Module Adapters
// Functions to map database rows to domain types

import type { Tables } from '@/integrations/supabase/types';
import type { AssemblyOrder, FinalInspection, AssemblyStatus } from '../types/assembly.types';

type AssemblyOrderRow = Tables<'assembly_orders'>;
type FinalInspectionRow = Tables<'final_inspections'>;

export function mapOrderRowToOrder(row: AssemblyOrderRow & {
  projects?: { name: string; customer_id: string } | null;
  deals?: { title: string } | null;
  profiles?: { full_name: string } | null;
}): AssemblyOrder {
  return {
    id: row.id,
    project_id: row.project_id,
    deal_id: row.deal_id,
    montador_id: row.montador_id,
    scheduled_date: row.scheduled_date,
    status: row.status as AssemblyStatus,
    observations: row.observations,
    material_request: row.material_request,
    assembly_value: row.assembly_value,
    company_id: row.company_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    projects: row.projects,
    deals: row.deals,
    profiles: row.profiles,
  };
}

export function mapInspectionRowToInspection(row: FinalInspectionRow): FinalInspection {
  return {
    id: row.id,
    assembly_order_id: row.assembly_order_id,
    customer_name: row.customer_name,
    approved: row.approved,
    observations: row.observations,
    signature_url: row.signature_url,
    created_at: row.created_at,
  };
}
