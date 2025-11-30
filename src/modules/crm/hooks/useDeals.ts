import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Deal {
  id: string;
  title: string;
  description?: string | null;
  stage_id: string;
  pipeline_id: string;
  position: number;
  customer_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  estimated_value?: number | null;
  final_value?: number | null;
  expected_close_date?: string | null;
  actual_close_date?: string | null;
  status?: string | null;
  project_id?: string | null;
  responsible_id?: string | null;
  company_id: string;
  created_at: string;
  updated_at: string;
  customers?: { name: string } | null;
}

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
