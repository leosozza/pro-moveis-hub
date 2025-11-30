// useUpdateOrderStatus Hook
// React hook for updating assembly order status

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOrderStatus } from '../services/assembly.service';
import type { AssemblyStatus } from '../types/assembly.types';
import { toast } from 'sonner';

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: AssemblyStatus }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assembly_orders'] });
      toast.success('Status atualizado!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status');
    },
  });

  return {
    updateStatus: (orderId: string, status: AssemblyStatus) =>
      mutation.mutateAsync({ orderId, status }),
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};
