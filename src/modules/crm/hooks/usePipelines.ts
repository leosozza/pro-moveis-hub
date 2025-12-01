/**
 * usePipelines Hook
 * Custom hook for fetching and managing pipelines.
 */

import { useQuery } from '@tanstack/react-query';
import { pipelinesService } from '../services/pipelines.service';
import type { Pipeline } from '../types/crm.types';

/**
 * Fetch a pipeline by type
 */
export function usePipeline(type: Pipeline['type']) {
  return useQuery({
    queryKey: [`${type}_pipeline`],
    queryFn: () => pipelinesService.getByType(type),
  });
}

/**
 * Fetch all pipelines
 */
export function usePipelines() {
  return useQuery({
    queryKey: ['pipelines'],
    queryFn: () => pipelinesService.getAll(),
  });
}

/**
 * Fetch a specific pipeline by ID
 */
export function usePipelineById(pipelineId: string | undefined) {
  return useQuery({
    queryKey: ['pipeline', pipelineId],
    queryFn: () => pipelinesService.getById(pipelineId!),
    enabled: !!pipelineId,
  });
}
