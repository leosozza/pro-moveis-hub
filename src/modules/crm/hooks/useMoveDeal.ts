import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UseMoveDealReturn {
  moveDeal: (dealId: string, newStageId: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export const useMoveDeal = (): UseMoveDealReturn => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async ({ dealId, newStageId }: { dealId: string; newStageId: string }) => {
      const { error } = await supabase
        .from("deals")
        .update({ stage_id: newStageId })
        .eq("id", dealId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal movido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao mover deal');
    },
  });

  return {
    moveDeal: (dealId: string, newStageId: string) =>
      new Promise((resolve, reject) => {
        mutation.mutate({ dealId, newStageId }, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        });
      }),
    isLoading: mutation.isPending,
    error: mutation.error as Error | null,
  };
};
