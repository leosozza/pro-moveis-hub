import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Deal, CreateDealInput } from "./types";

export interface CreateDealData extends CreateDealInput {
  pipelineId: string;
  stageId: string;
}

export interface UseCreateDealReturn {
  createDeal: (data: CreateDealData) => Promise<Deal>;
  isLoading: boolean;
  error: Error | null;
}

export const useCreateDeal = (): UseCreateDealReturn => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async ({ pipelineId, stageId, ...data }: CreateDealData) => {
      // Get the user's company_id
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", userData.user.id)
        .single();
      
      if (profileError) throw profileError;

      // Get max position in the stage to place new deal at the end
      const { data: maxPositionData } = await supabase
        .from("deals")
        .select("position")
        .eq("stage_id", stageId)
        .order("position", { ascending: false })
        .limit(1)
        .single();
      
      const nextPosition = (maxPositionData?.position ?? -1) + 1;
      
      const { data: result, error } = await supabase
        .from("deals")
        .insert({
          ...data,
          pipeline_id: pipelineId,
          stage_id: stageId,
          company_id: profile.company_id,
          position: nextPosition,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return result as Deal;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals', variables.pipelineId] });
      toast.success('Deal criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar deal');
    },
  });

  return {
    createDeal: (data: CreateDealData) =>
      new Promise((resolve, reject) => {
        mutation.mutate(data, {
          onSuccess: (result) => resolve(result),
          onError: (error) => reject(error),
        });
      }),
    isLoading: mutation.isPending,
    error: mutation.error as Error | null,
  };
};
