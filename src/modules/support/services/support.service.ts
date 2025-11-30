// Support Service
// Encapsulates all service ticket-related Supabase operations

import { supabase } from '@/integrations/supabase/client';
import type { ServiceTicket, CreateTicketInput, UpdateTicketInput } from '../types/support.types';
import { mapTicketRowToTicket } from '../adapters/support.adapters';

export async function listServiceTickets(pipelineId: string): Promise<ServiceTicket[]> {
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
  return (data || []).map(mapTicketRowToTicket);
}

export async function getTicketById(ticketId: string): Promise<ServiceTicket> {
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
  return mapTicketRowToTicket(data);
}

export async function createTicket(input: CreateTicketInput): Promise<ServiceTicket> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Perfil não encontrado');

  const { data, error } = await supabase
    .from('service_tickets')
    .insert({
      ...input,
      company_id: profile.company_id,
      responsible_id: input.responsible_id || user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return mapTicketRowToTicket(data);
}

export async function updateTicket(ticketId: string, input: UpdateTicketInput): Promise<ServiceTicket> {
  const { data, error } = await supabase
    .from('service_tickets')
    .update(input)
    .eq('id', ticketId)
    .select()
    .single();

  if (error) throw error;
  return mapTicketRowToTicket(data);
}

export async function deleteTicket(ticketId: string): Promise<void> {
  const { error } = await supabase
    .from('service_tickets')
    .delete()
    .eq('id', ticketId);

  if (error) throw error;
}

export async function moveTicket(ticketId: string, newStageId: string): Promise<void> {
  const { error } = await supabase
    .from('service_tickets')
    .update({ stage_id: newStageId })
    .eq('id', ticketId);

  if (error) throw error;
}

// Export all functions as a service object for convenience
export const supportService = {
  listServiceTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  moveTicket,
};
