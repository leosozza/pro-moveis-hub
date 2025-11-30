// Deals Service
// Encapsulates all deal-related Supabase operations

import { supabase } from '@/integrations/supabase/client';
import type { Deal, CreateDealInput, UpdateDealInput } from '../types/crm.types';
import { mapDealRowToDeal } from '../adapters/crm.adapters';

export async function listDeals(pipelineId: string): Promise<Deal[]> {
  const { data, error } = await supabase
    .from('deals')
    .select(`
      *,
      customers:customer_id(name),
      projects:project_id(name),
      profiles:responsible_id(full_name)
    `)
    .eq('pipeline_id', pipelineId)
    .order('position');

  if (error) throw error;
  return (data || []).map(mapDealRowToDeal);
}

export async function getDealById(dealId: string): Promise<Deal> {
  const { data, error } = await supabase
    .from('deals')
    .select(`
      *,
      customers:customer_id(name),
      projects:project_id(name),
      profiles:responsible_id(full_name)
    `)
    .eq('id', dealId)
    .single();

  if (error) throw error;
  return mapDealRowToDeal(data);
}

export async function createDeal(input: CreateDealInput): Promise<Deal> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Perfil não encontrado');

  const { data, error } = await supabase
    .from('deals')
    .insert({
      ...input,
      company_id: profile.company_id,
      responsible_id: input.responsible_id || user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return mapDealRowToDeal(data);
}

export async function updateDeal(dealId: string, input: UpdateDealInput): Promise<Deal> {
  const { data, error } = await supabase
    .from('deals')
    .update(input)
    .eq('id', dealId)
    .select()
    .single();

  if (error) throw error;
  return mapDealRowToDeal(data);
}

export async function deleteDeal(dealId: string): Promise<void> {
  const { error } = await supabase
    .from('deals')
    .delete()
    .eq('id', dealId);

  if (error) throw error;
}

export async function moveDeal(dealId: string, newStageId: string): Promise<void> {
  const { error } = await supabase
    .from('deals')
    .update({ stage_id: newStageId })
    .eq('id', dealId);

  if (error) throw error;
}

// Export all functions as a service object for convenience
export const dealsService = {
  listDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  moveDeal,
};
