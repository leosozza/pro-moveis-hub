import { useState } from "react";
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
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

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