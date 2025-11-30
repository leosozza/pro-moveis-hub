import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PipelineType = 'vendas' | 'pos_venda' | 'assistencia';

export interface Stage {
  id: string;
  name: string;
  position: number;
  color: string | null;
  is_win_stage?: boolean | null;
  is_loss_stage?: boolean | null;
  pipeline_id: string;
  created_at: string;
}

export interface Pipeline {
  id: string;
  name: string;
  type: string;
  company_id: string;
  created_at: string;
  updated_at: string;
  stages?: Stage[];
}

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
