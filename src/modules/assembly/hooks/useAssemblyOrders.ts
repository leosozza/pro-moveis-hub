/**
 * useAssemblyOrders Hook
 * Custom hook for fetching and managing assembly orders.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assemblyService } from '../services/assembly.service';
import type { CreateInspectionInput } from '../types/assembly.types';

/**
 * Fetch all assembly orders
 */
export function useAssemblyOrders() {
  return useQuery({
    queryKey: ['assembly_orders'],
    queryFn: () => assemblyService.list(),
  });
}

/**
 * Fetch a single assembly order
 */
export function useAssemblyOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ['assembly_order', orderId],
    queryFn: () => assemblyService.getById(orderId!),
    enabled: !!orderId,
  });
}

/**
 * Update assembly order status
 */
export function useUpdateAssemblyStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      assemblyService.updateStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assembly_orders'] });
    },
  });
}

/**
 * Create a final inspection
 */
export function useCreateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInspectionInput) => assemblyService.createInspection(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assembly_orders'] });
    },
  });
}
