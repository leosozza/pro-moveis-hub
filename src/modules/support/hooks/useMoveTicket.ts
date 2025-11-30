// useMoveTicket Hook
// React hook for moving service tickets between stages

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { moveTicket } from '../services/support.service';
import { toast } from 'sonner';

export const useMoveTicket = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ ticketId, newStageId }: { ticketId: string; newStageId: string }) =>
      moveTicket(ticketId, newStageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_tickets'] });
      toast.success('Chamado movido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao mover chamado');
    },
  });

  return {
    moveTicket: (ticketId: string, newStageId: string) =>
      mutation.mutateAsync({ ticketId, newStageId }),
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};
