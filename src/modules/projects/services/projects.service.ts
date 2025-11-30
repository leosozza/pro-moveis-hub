/**
 * Projects Service
 * Encapsulates all Supabase operations for projects.
 */

import { supabase } from '@/integrations/supabase/client';
import { mapProjectRowToProject } from '../adapters/projects.adapters';
import type { Project, CreateProjectInput } from '../types/projects.types';

export const projectsService = {
  /**
   * List all projects for the current company
   */
  async list(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        customers:customer_id(name),
        profiles:projetista_id(full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapProjectRowToProject);
  },

  /**
   * Get a project by ID
   */
  async getById(projectId: string): Promise<Project | null> {
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

    return data ? mapProjectRowToProject(data) : null;
  },

  /**
   * Create a new project
   */
  async create(input: CreateProjectInput): Promise<Project> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userData.user.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: input.name,
        customer_id: input.customerId,
        description: input.description,
        company_id: profile.company_id,
        projetista_id: userData.user.id,
      })
      .select(`
        *,
        customers:customer_id(name),
        profiles:projetista_id(full_name)
      `)
      .single();

    if (error) throw error;

    return mapProjectRowToProject(data);
  },

  /**
   * Get projects for selection (id and name only)
   */
  async listForSelection(): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name')
      .order('name');

    if (error) throw error;

    return data || [];
  },
};
