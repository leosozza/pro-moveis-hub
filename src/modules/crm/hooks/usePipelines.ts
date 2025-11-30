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
