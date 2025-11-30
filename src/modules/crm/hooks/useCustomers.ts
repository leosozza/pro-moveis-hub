/**
 * useCustomers Hook
 * Custom hook for fetching and managing customers.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersService } from '../services/customers.service';
import type { CreateCustomerInput } from '../types/crm.types';

/**
 * Fetch all customers
 */
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => customersService.list(),
  });
}

/**
 * Fetch a customer by ID
 */
export function useCustomer(customerId: string | undefined) {
  return useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customersService.getById(customerId!),
    enabled: !!customerId,
  });
}

/**
 * Fetch customers for selection (id and name only)
 */
export function useCustomersForSelection() {
  return useQuery({
    queryKey: ['customers_selection'],
    queryFn: () => customersService.listForSelection(),
  });
}

/**
 * Create a new customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomerInput) => customersService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers_selection'] });
    },
  });
}
