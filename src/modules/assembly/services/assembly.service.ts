// Assembly Service
// Encapsulates all assembly order-related Supabase operations

import { supabase } from '@/integrations/supabase/client';
import type { 
  AssemblyOrder, 
  CreateAssemblyOrderInput, 
  UpdateAssemblyOrderInput,
  FinalInspection,
  CreateInspectionInput,
  AssemblyStatus
} from '../types/assembly.types';
import { mapOrderRowToOrder, mapInspectionRowToInspection } from '../adapters/assembly.adapters';

export async function listAssemblyOrders(): Promise<AssemblyOrder[]> {
  const { data, error } = await supabase
    .from('assembly_orders')
    .select(`
      *,
      projects:project_id(name, customer_id),
      deals:deal_id(title),
      profiles:montador_id(full_name)
    `)
    .order('scheduled_date');

  if (error) throw error;
  return (data || []).map(mapOrderRowToOrder);
}

export async function getOrderById(orderId: string): Promise<AssemblyOrder> {
  const { data, error } = await supabase
    .from('assembly_orders')
    .select(`
      *,
      projects:project_id(name, customer_id),
      deals:deal_id(title),
      profiles:montador_id(full_name)
    `)
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return mapOrderRowToOrder(data);
}

export async function createAssemblyOrder(input: CreateAssemblyOrderInput): Promise<AssemblyOrder> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Perfil não encontrado');

  const { data, error } = await supabase
    .from('assembly_orders')
    .insert({
      ...input,
      company_id: profile.company_id,
    })
    .select()
    .single();

  if (error) throw error;
  return mapOrderRowToOrder(data);
}

export async function updateAssemblyOrder(orderId: string, input: UpdateAssemblyOrderInput): Promise<AssemblyOrder> {
  const { data, error } = await supabase
    .from('assembly_orders')
    .update(input)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return mapOrderRowToOrder(data);
}

export async function updateOrderStatus(orderId: string, status: AssemblyStatus): Promise<void> {
  const { error } = await supabase
    .from('assembly_orders')
    .update({ status })
    .eq('id', orderId);

  if (error) throw error;
}

export async function deleteAssemblyOrder(orderId: string): Promise<void> {
  const { error } = await supabase
    .from('assembly_orders')
    .delete()
    .eq('id', orderId);

  if (error) throw error;
}

export async function createFinalInspection(input: CreateInspectionInput): Promise<FinalInspection> {
  const { data, error } = await supabase
    .from('final_inspections')
    .insert(input)
    .select()
    .single();

  if (error) throw error;

  // Update order status to completed
  await supabase
    .from('assembly_orders')
    .update({ status: 'concluida' })
    .eq('id', input.assembly_order_id);

  return mapInspectionRowToInspection(data);
}

// Export all functions as a service object for convenience
export const assemblyService = {
  listAssemblyOrders,
  getOrderById,
  createAssemblyOrder,
  updateAssemblyOrder,
  updateOrderStatus,
  deleteAssemblyOrder,
  createFinalInspection,
};
