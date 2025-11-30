// Projects Service
// Encapsulates all project-related Supabase operations

import { supabase } from '@/integrations/supabase/client';
import type { Project, CreateProjectInput, UpdateProjectInput } from '../types/projects.types';
import { mapProjectRowToProject } from '../adapters/projects.adapters';

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      customers:customer_id(name),
      profiles:projetista_id(full_name)
    `)
    .order('name');

  if (error) throw error;
  return (data || []).map(mapProjectRowToProject);
}

export async function getProjectById(projectId: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      customers:customer_id(name),
      profiles:projetista_id(full_name)
    `)
    .eq('id', projectId)
    .single();

  if (error) throw error;
  return mapProjectRowToProject(data);
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Perfil não encontrado');

  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...input,
      company_id: profile.company_id,
    })
    .select()
    .single();

  if (error) throw error;
  return mapProjectRowToProject(data);
}

export async function updateProject(projectId: string, input: UpdateProjectInput): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update(input)
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return mapProjectRowToProject(data);
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
}

// Export all functions as a service object for convenience
export const projectsService = {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
