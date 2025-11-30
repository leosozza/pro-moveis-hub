import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Deal } from "./types";

export interface UseDealsReturn {
  deals: Deal[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useDeals = (pipelineId?: string): UseDealsReturn => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['deals', pipelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("pipeline_id", pipelineId!)
        .order("position");
      
      if (error) throw error;
      
      return data?.map(d => ({
        ...d,
        customers: d.customer_name ? { name: d.customer_name } : null,
      })) as Deal[];
    },
    enabled: !!pipelineId,
  });

  return {
    deals: data || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
