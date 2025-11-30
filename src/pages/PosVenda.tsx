import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KanbanBoard, KanbanCard } from "@/components/KanbanBoard";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const PosVenda = () => {
  const queryClient = useQueryClient();
  const [selectedDeal, setSelectedDeal] = useState<KanbanCard | null>(null);

  const { data: pipeline } = useQuery({
    queryKey: ["pos_venda_pipeline"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipelines")
        .select("*, stages(*)")
        .eq("type", "pos_venda")
        .order("created_at", { ascending: true })
        .limit(1);
      if (error) throw error;
      
      const pipelineData = data?.[0] || null;
      
      // Ordenar stages por position
      if (pipelineData?.stages) {
        pipelineData.stages = pipelineData.stages.sort((a: { position: number }, b: { position: number }) => a.position - b.position);
      }
      
      return pipelineData;
    },
  });

  const { data: deals, isLoading } = useQuery({
    queryKey: ["pos_venda_deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          customers:customer_id(name),
          projects:project_id(name),
          profiles:responsible_id(full_name)
        `)
        .eq("pipeline_id", pipeline?.id)
        .order("position");
      if (error) throw error;
      return data;
    },
    enabled: !!pipeline?.id,
  });

  const moveDealMutation = useMutation({
    mutationFn: async ({ cardId, newStageId }: { cardId: string; newStageId: string }) => {
      const { error } = await supabase
        .from("deals")
        .update({ stage_id: newStageId })
        .eq("id", cardId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos_venda_deals"] });
      toast.success("Card movido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao mover card");
    },
  });

  const handleCardMove = async (cardId: string, newStageId: string) => {
    await moveDealMutation.mutateAsync({ cardId, newStageId });
  };

  const handleCardClick = (card: KanbanCard) => {
    setSelectedDeal(card);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pós-Venda</h1>
        <p className="text-muted-foreground">
          Acompanhe a execução dos projetos vendidos
        </p>
      </div>

      {pipeline && (
        <KanbanBoard
          stages={pipeline.stages || []}
          cards={deals || []}
          onCardClick={handleCardClick}
          onCardMove={handleCardMove}
          isMoving={moveDealMutation.isPending}
        />
      )}
    </div>
  );
};

export default PosVenda;