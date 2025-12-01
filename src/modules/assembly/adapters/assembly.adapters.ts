/**
 * Assembly Adapters
 */

import type { Tables } from '@/integrations/supabase/types';
import type { AssemblyOrder, FinalInspection, AssemblyPhoto } from '../types/assembly.types';

type AssemblyOrderRowWithRelations = Tables<'assembly_orders'> & {
  projects?: { name: string; customer_id?: string } | null;
  deals?: { title: string } | null;
  profiles?: { full_name: string } | null;
};

export const mapAssemblyOrderRowToOrder = (row: AssemblyOrderRowWithRelations): AssemblyOrder => ({
  id: row.id,
  projectId: row.project_id,
  dealId: row.deal_id,
  montadorId: row.montador_id,
  status: row.status,
  scheduledDate: row.scheduled_date,
  assemblyValue: row.assembly_value,
  materialRequest: row.material_request,
  observations: row.observations,
  companyId: row.company_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  project: row.projects ? { name: row.projects.name, customerId: row.projects.customer_id } : null,
  deal: row.deals ? { title: row.deals.title } : null,
  montador: row.profiles ? { fullName: row.profiles.full_name } : null,
});

export const mapFinalInspectionRowToInspection = (row: Tables<'final_inspections'>): FinalInspection => ({
  id: row.id,
  assemblyOrderId: row.assembly_order_id,
  customerName: row.customer_name,
  approved: row.approved,
  observations: row.observations,
  signatureUrl: row.signature_url,
  createdAt: row.created_at,
});

export const mapAssemblyPhotoRowToPhoto = (row: Tables<'assembly_photos'>): AssemblyPhoto => ({
  id: row.id,
  assemblyOrderId: row.assembly_order_id,
  photoUrl: row.photo_url,
  description: row.description,
  createdAt: row.created_at,
});
