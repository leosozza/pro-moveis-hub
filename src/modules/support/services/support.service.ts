/**
 * Support Service
 * Encapsulates all Supabase operations for service tickets.
 */

import { supabase } from '@/integrations/supabase/client';
import { mapServiceTicketRowToTicket } from '../adapters/support.adapters';
import type { ServiceTicket, CreateTicketInput } from '../types/support.types';

export const supportService = {
  /**
   * List service tickets by pipeline ID
   */
  async listByPipeline(pipelineId: string): Promise<ServiceTicket[]> {
    const { data, error } = await supabase
      .from('service_tickets')
      .select(`
        *,
        customers:customer_id(name),
        projects:project_id(name),
        profiles:responsible_id(full_name)
      `)
      .eq('pipeline_id', pipelineId)
      .order('position');

    if (error) throw error;

    return (data || []).map(mapServiceTicketRowToTicket);
  },

  /**
   * Get a single service ticket by ID
   */
  async getById(ticketId: string): Promise<ServiceTicket | null> {
    const { data, error } = await supabase
      .from('service_tickets')
      .select(`
        *,
        customers:customer_id(name),
        projects:project_id(name),
        profiles:responsible_id(full_name)
      `)
      .eq('id', ticketId)
      .single();

    if (error) throw error;

    return data ? mapServiceTicketRowToTicket(data) : null;
  },

  /**
   * Create a new service ticket
   */
  async create(input: CreateTicketInput, pipelineId: string): Promise<ServiceTicket> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userData.user.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('service_tickets')
      .insert({
        title: input.title,
        description: input.description,
        customer_id: input.customerId,
        project_id: input.projectId,
        stage_id: input.stageId,
        priority: input.priority || 'media',
        company_id: profile.company_id,
        pipeline_id: pipelineId,
        responsible_id: userData.user.id,
        position: 0,
      })
      .select(`
        *,
        customers:customer_id(name),
        projects:project_id(name),
        profiles:responsible_id(full_name)
      `)
      .single();

    if (error) throw error;

    return mapServiceTicketRowToTicket(data);
  },

  /**
   * Move a service ticket to a different stage
   */
  async moveToStage(ticketId: string, newStageId: string): Promise<void> {
    const { error } = await supabase
      .from('service_tickets')
      .update({ stage_id: newStageId })
      .eq('id', ticketId);

    if (error) throw error;
  },
};
