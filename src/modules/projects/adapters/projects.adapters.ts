/**
 * Projects Adapters
 */

import type { Tables } from '@/integrations/supabase/types';
import type { Project, PromobFile } from '../types/projects.types';

type ProjectRowWithRelations = Tables<'projects'> & {
  customers?: { name: string } | null;
  profiles?: { full_name: string } | null;
};

export const mapProjectRowToProject = (row: ProjectRowWithRelations): Project => ({
  id: row.id,
  name: row.name,
  description: row.description,
  customerId: row.customer_id,
  projetistaId: row.projetista_id,
  status: row.status,
  companyId: row.company_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  customer: row.customers ? { name: row.customers.name } : null,
  projetista: row.profiles ? { fullName: row.profiles.full_name } : null,
});

export const mapPromobFileRowToFile = (row: Tables<'promob_files'>): PromobFile => ({
  id: row.id,
  projectId: row.project_id,
  customerId: row.customer_id,
  filePath: row.file_path,
  originalFilename: row.original_filename,
  ambiente: row.ambiente,
  fileType: row.file_type,
  uploadedBy: row.uploaded_by,
  companyId: row.company_id,
  createdAt: row.created_at,
});
