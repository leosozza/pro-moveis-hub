// useStages Hook
// React hook for fetching and managing pipeline stages

import { useQuery } from '@tanstack/react-query';
import { listStages } from '../services/stages.service';

export const useStages = (pipelineId?: string) => {
  const query = useQuery({
    queryKey: ['stages', pipelineId],
    queryFn: () => listStages(pipelineId!),
    enabled: !!pipelineId,
  });

  return {
    stages: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
