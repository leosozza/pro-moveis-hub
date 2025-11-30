/**
 * Customers Service
 * Encapsulates all Supabase operations for customers.
 */

import { supabase } from '@/integrations/supabase/client';
import { mapCustomerRowToCustomer } from '../adapters/crm.adapters';
import type { Customer, CreateCustomerInput } from '../types/crm.types';

export const customersService = {
  /**
   * List all customers for the current company
   */
  async list(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapCustomerRowToCustomer);
  },

  /**
   * Get a customer by ID
   */
  async getById(customerId: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (error) throw error;

    return data ? mapCustomerRowToCustomer(data) : null;
  },

  /**
   * Create a new customer
   */
  async create(input: CreateCustomerInput): Promise<Customer> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userData.user.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: input.name,
        whatsapp: input.whatsapp,
        phone: input.phone,
        email: input.email,
        cpf_cnpj: input.cpfCnpj,
        address: input.address,
        city: input.city,
        state: input.state,
        zip_code: input.zipCode,
        origem: input.origem,
        observacoes: input.observacoes,
        company_id: profile.company_id,
        created_by: userData.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return mapCustomerRowToCustomer(data);
  },

  /**
   * Get customers for selection (id and name only)
   */
  async listForSelection(): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name')
      .order('name');

    if (error) throw error;

    return data || [];
  },
};
