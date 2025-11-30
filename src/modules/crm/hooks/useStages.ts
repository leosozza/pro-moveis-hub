import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export interface UseStagesReturn {
  stages: Stage[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useStages = (pipelineId?: string): UseStagesReturn => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['stages', pipelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stages")
        .select("*")
        .eq("pipeline_id", pipelineId!);
      
      if (error) throw error;
      
      return data as Stage[];
    },
    enabled: !!pipelineId,
  });

  return {
    stages: (data || []).sort((a, b) => a.position - b.position),
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
