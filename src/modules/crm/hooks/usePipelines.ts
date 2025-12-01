import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Pipeline, PipelineType, Stage } from "./types";

export interface UsePipelinesReturn {
  pipelines: Pipeline[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const usePipelines = (type?: PipelineType): UsePipelinesReturn => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['pipelines', type],
    queryFn: async () => {
      let query = supabase
        .from("pipelines")
        .select("*, stages(*)");
      
      if (type) {
        query = query.eq("type", type);
      }
      
      query = query.order("created_at", { ascending: true });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Sort stages by position
      return data?.map(pipeline => ({
        ...pipeline,
        stages: pipeline.stages?.sort((a: Stage, b: Stage) => a.position - b.position),
      })) as Pipeline[];
    },
  });

  return {
    pipelines: data || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
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
