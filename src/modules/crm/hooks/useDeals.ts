// useDeals Hook
// React hook for fetching and managing deals

import { useQuery } from '@tanstack/react-query';
import { listDeals } from '../services/deals.service';

export const useDeals = (pipelineId?: string) => {
  const query = useQuery({
    queryKey: ['deals', pipelineId],
    queryFn: () => listDeals(pipelineId!),
    enabled: !!pipelineId,
  });

  return {
    deals: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
