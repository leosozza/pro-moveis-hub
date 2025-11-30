// useMoveDeal Hook
// React hook for moving deals between stages

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { moveDeal } from '../services/deals.service';
import { toast } from 'sonner';

export const useMoveDeal = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ dealId, newStageId }: { dealId: string; newStageId: string }) =>
      moveDeal(dealId, newStageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Card movido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao mover card');
    },
  });

  return {
    moveDeal: (dealId: string, newStageId: string) =>
      mutation.mutateAsync({ dealId, newStageId }),
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};
