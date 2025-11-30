/**
 * Assembly Domain Types
 */

export interface AssemblyOrder {
  id: string;
  projectId: string;
  dealId?: string | null;
  montadorId?: string | null;
  status: string;
  scheduledDate?: string | null;
  assemblyValue?: number | null;
  materialRequest?: string | null;
  observations?: string | null;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  // Joined relations
  project?: { name: string; customerId?: string } | null;
  deal?: { title: string } | null;
  montador?: { fullName: string } | null;
}

export interface FinalInspection {
  id: string;
  assemblyOrderId: string;
  customerName: string;
  approved: boolean;
  observations?: string | null;
  signatureUrl?: string | null;
  createdAt: string;
}

export interface AssemblyPhoto {
  id: string;
  assemblyOrderId: string;
  photoUrl: string;
  description?: string | null;
  createdAt: string;
}

export interface CreateInspectionInput {
  assemblyOrderId: string;
  customerName: string;
  approved: boolean;
  observations?: string;
}
