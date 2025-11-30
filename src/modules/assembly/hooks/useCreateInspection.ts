// useCreateInspection Hook
// React hook for creating final inspections

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFinalInspection } from '../services/assembly.service';
import type { CreateInspectionInput } from '../types/assembly.types';
import { toast } from 'sonner';

export const useCreateInspection = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: CreateInspectionInput) => createFinalInspection(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assembly_orders'] });
      toast.success('Vistoria registrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao registrar vistoria');
    },
  });

  return {
    createInspection: (input: CreateInspectionInput) => mutation.mutateAsync(input),
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};
