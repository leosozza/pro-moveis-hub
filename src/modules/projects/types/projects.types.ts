/**
 * Projects Domain Types
 */

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  customerId: string;
  projetistaId?: string | null;
  status?: string | null;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  // Joined relations
  customer?: { name: string } | null;
  projetista?: { fullName: string } | null;
}

export interface PromobFile {
  id: string;
  projectId: string;
  customerId: string;
  filePath: string;
  originalFilename: string;
  ambiente: string;
  fileType?: string | null;
  uploadedBy?: string | null;
  companyId: string;
  createdAt: string;
}

export interface CreateProjectInput {
  name: string;
  customerId: string;
  description?: string;
}

export interface XmlUploadResult {
  promobFileId: string;
  itemsCount: number;
}
