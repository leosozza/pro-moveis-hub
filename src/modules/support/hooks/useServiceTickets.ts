// useServiceTickets Hook
// React hook for fetching service tickets

import { useQuery } from '@tanstack/react-query';
import { listServiceTickets } from '../services/support.service';

export const useServiceTickets = (pipelineId?: string) => {
  const query = useQuery({
    queryKey: ['service_tickets', pipelineId],
    queryFn: () => listServiceTickets(pipelineId!),
    enabled: !!pipelineId,
  });

  return {
    tickets: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
