import { useState } from "react";
import { usePipelineByType } from "@/modules/crm/hooks/usePipelines";
import { useDeals } from "@/modules/crm/hooks/useDeals";
import { useMoveDeal } from "@/modules/crm/hooks/useMoveDeal";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Loader2 } from "lucide-react";
import type { Deal } from "@/modules/crm/types/crm.types";

const PosVenda = () => {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const { pipeline, isLoading: pipelineLoading } = usePipelineByType('pos_venda');
  const { deals, isLoading: dealsLoading } = useDeals(pipeline?.id);
  const { moveDeal, isLoading: movingDeal } = useMoveDeal();

  const handleCardMove = async (cardId: string, newStageId: string) => {
    try {
      await moveDeal(cardId, newStageId);
    } catch (error) {
      // Error already handled by hook with toast
      console.error('Failed to move deal:', error);
    }
  };

  if (pipelineLoading || dealsLoading) {
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
          cards={deals}
          onCardClick={setSelectedDeal}
          onAddCard={() => {}}
          onCardMove={handleCardMove}
          isMoving={movingDeal}
        />
      )}
    </div>
  );
};

export default PosVenda;