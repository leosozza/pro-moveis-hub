import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KanbanBoard, KanbanCard } from "@/components/KanbanBoard";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Loader2 } from "lucide-react";
import { usePipeline, useDeals, useMoveDeal } from "@/modules/crm";
import { mapStageToLegacy } from "@/modules/crm/adapters/crm.adapters";
import { toast } from "sonner";

interface Deal {
  id: string;
  title: string;
  stage_id: string;
  position: number;
  customers?: { name: string } | null;
  projects?: { name: string } | null;
  profiles?: { full_name: string } | null;
}

const PosVenda = () => {
  const queryClient = useQueryClient();
  const [selectedDeal, setSelectedDeal] = useState<KanbanCard | null>(null);

  // Use CRM hooks
  const { data: pipeline } = usePipeline('pos_venda');
  const { dealsLegacy, isLoading } = useDeals(pipeline?.id);
  const moveDeal = useMoveDeal();

  const handleCardMove = async (cardId: string, newStageId: string) => {
    try {
      await moveDeal.mutateAsync({ dealId: cardId, newStageId });
      toast.success("Card movido com sucesso!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao mover card";
      toast.error(errorMessage);
    }
  };

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

  // Get stages in legacy format for KanbanBoard
  const stagesLegacy = pipeline?.stages?.map(mapStageToLegacy) || [];

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
          stages={stagesLegacy}
          cards={dealsLegacy}
          onCardClick={setSelectedDeal}
          onAddCard={() => {}}
          onCardMove={handleCardMove}
        />
      )}
    </div>
  );
};

export default PosVenda;