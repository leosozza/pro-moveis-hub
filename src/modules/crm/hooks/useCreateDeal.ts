import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Deal, CreateDealInput } from "./types";

export interface UseCreateDealReturn {
  createDeal: (data: CreateDealInput) => Promise<Deal>;
  isLoading: boolean;
  error: Error | null;
}

export const useCreateDeal = (pipelineId: string, stageId: string): UseCreateDealReturn => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async (data: CreateDealInput) => {
      // Get the user's company_id
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", userData.user.id)
        .single();
      
      if (profileError) throw profileError;
      
      const { data: result, error } = await supabase
        .from("deals")
        .insert({
          ...data,
          pipeline_id: pipelineId,
          stage_id: stageId,
          company_id: profile.company_id,
          position: 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return result as Deal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', pipelineId] });
      toast.success('Deal criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar deal');
    },
  });

  return {
    createDeal: (data: CreateDealInput) =>
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
