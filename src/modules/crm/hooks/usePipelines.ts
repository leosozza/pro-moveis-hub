// usePipelines Hook
// React hook for fetching and managing pipelines

import { useQuery } from '@tanstack/react-query';
import { listPipelines, getPipelineByType } from '../services/pipelines.service';
import type { PipelineType } from '../types/crm.types';

export const usePipelines = (type?: PipelineType) => {
  const query = useQuery({
    queryKey: ['pipelines', type],
    queryFn: () => listPipelines(type),
  });

  return {
    pipelines: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const usePipelineByType = (type: PipelineType) => {
  const query = useQuery({
    queryKey: ['pipeline', type],
    queryFn: () => getPipelineByType(type),
  });

  return {
    pipeline: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
