// Projects Module Adapters
// Functions to map database rows to domain types

import type { Tables } from '@/integrations/supabase/types';
import type { PromobFile, Project } from '../types/projects.types';

type PromobFileRow = Tables<'promob_files'>;
type ProjectRow = Tables<'projects'>;

export function mapPromobFileRowToPromobFile(row: PromobFileRow): PromobFile {
  return {
    id: row.id,
    project_id: row.project_id,
    customer_id: row.customer_id,
    file_path: row.file_path,
    original_filename: row.original_filename,
    ambiente: row.ambiente,
    file_type: row.file_type,
    company_id: row.company_id,
    uploaded_by: row.uploaded_by,
    created_at: row.created_at,
  };
}

export function mapProjectRowToProject(row: ProjectRow & {
  customers?: { name: string } | null;
  profiles?: { full_name: string } | null;
}): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    customer_id: row.customer_id,
    projetista_id: row.projetista_id,
    status: row.status,
    company_id: row.company_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    customers: row.customers,
    profiles: row.profiles,
  };
}
