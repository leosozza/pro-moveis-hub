// Projects Module Types
// Types for projects and XML file handling

export interface PromobFile {
  id: string;
  project_id: string;
  customer_id: string;
  file_path: string;
  original_filename: string;
  ambiente: string;
  file_type: string | null;
  company_id: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  customer_id: string;
  projetista_id: string | null;
  status: string | null;
  company_id: string;
  created_at: string;
  updated_at: string;
  // Relations
  customers?: { name: string } | null;
  profiles?: { full_name: string } | null;
}

export interface ProcessXmlResult {
  success: boolean;
  items_count: number;
  message?: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  customer_id: string;
  projetista_id?: string;
  status?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  customer_id?: string;
  projetista_id?: string;
  status?: string;
}

export interface UploadXmlInput {
  file: File;
  projectId: string;
  customerId: string;
}
