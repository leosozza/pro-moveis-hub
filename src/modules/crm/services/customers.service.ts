// Customers Service
// Encapsulates all customer-related Supabase operations

import { supabase } from '@/integrations/supabase/client';
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from '../types/crm.types';
import { mapCustomerRowToCustomer } from '../adapters/crm.adapters';

export async function listCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name');

  if (error) throw error;
  return (data || []).map(mapCustomerRowToCustomer);
}

export async function getCustomerById(customerId: string): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (error) throw error;
  return mapCustomerRowToCustomer(data);
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Perfil não encontrado');

  const { data, error } = await supabase
    .from('customers')
    .insert({
      ...input,
      company_id: profile.company_id,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return mapCustomerRowToCustomer(data);
}

export async function updateCustomer(customerId: string, input: UpdateCustomerInput): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .update(input)
    .eq('id', customerId)
    .select()
    .single();

  if (error) throw error;
  return mapCustomerRowToCustomer(data);
}

// Export all functions as a service object for convenience
export const customersService = {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
};
