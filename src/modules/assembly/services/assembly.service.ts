/**
 * Assembly Service
 * Encapsulates all Supabase operations for assembly orders.
 */

import { supabase } from '@/integrations/supabase/client';
import { mapAssemblyOrderRowToOrder, mapFinalInspectionRowToInspection } from '../adapters/assembly.adapters';
import type { AssemblyOrder, FinalInspection, CreateInspectionInput } from '../types/assembly.types';

export const assemblyService = {
  /**
   * List all assembly orders
   */
  async list(): Promise<AssemblyOrder[]> {
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

    return (data || []).map(mapAssemblyOrderRowToOrder);
  },

  /**
   * Get an assembly order by ID
   */
  async getById(orderId: string): Promise<AssemblyOrder | null> {
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

    return data ? mapAssemblyOrderRowToOrder(data) : null;
  },

  /**
   * Update assembly order status
   */
  async updateStatus(orderId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('assembly_orders')
      .update({ status })
      .eq('id', orderId);

    if (error) throw error;
  },

  /**
   * Create a final inspection and mark order as complete
   */
  async createInspection(input: CreateInspectionInput): Promise<FinalInspection> {
    const { data, error } = await supabase
      .from('final_inspections')
      .insert({
        assembly_order_id: input.assemblyOrderId,
        customer_name: input.customerName,
        approved: input.approved,
        observations: input.observations,
      })
      .select()
      .single();

    if (error) throw error;

    // Update order status to completed
    await supabase
      .from('assembly_orders')
      .update({ status: 'concluida' })
      .eq('id', input.assemblyOrderId);

    return mapFinalInspectionRowToInspection(data);
  },
};
