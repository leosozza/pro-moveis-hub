import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KanbanBoard, KanbanCard } from "@/components/KanbanBoard";
import { useQueryClient } from "@tanstack/react-query";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Settings } from "lucide-react";
import { DealForm } from "@/components/DealForm";
import { DealDetails } from "@/components/DealDetails";
import { StageConfigModal } from "@/components/StageConfigModal";
import { usePipeline, useDeals, useMoveDeal } from "@/modules/crm";
import { mapStageToLegacy } from "@/modules/crm/adapters/crm.adapters";
import { toast } from "sonner";

const Vendas = () => {
  const queryClient = useQueryClient();
  const [openNewDeal, setOpenNewDeal] = useState(false);
  const [openDealDetails, setOpenDealDetails] = useState(false);
  const [openStageConfig, setOpenStageConfig] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [selectedDeal, setSelectedDeal] = useState<{ id: string; title: string; customer_name?: string } | null>(null);

  // Use CRM hooks
  const { data: pipeline } = usePipeline('vendas');
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
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Card movido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao mover card");
    },
  });

  const handleCardMove = async (cardId: string, newStageId: string) => {
    await moveDealMutation.mutateAsync({ cardId, newStageId });
  };

  const handleAddCard = (stageId: string) => {
    setSelectedStageId(stageId);
    setOpenNewDeal(true);
  };

  const handleCardClick = (card: KanbanCard) => {
    setSelectedDeal({
      id: card.id,
      title: card.title,
      customer_name: card.customers?.name,
    });
    setOpenDealDetails(true);
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

  // Verificar se o pipeline existe e tem estágios
  if (!pipeline?.id || !pipeline?.stages || pipeline.stages.length === 0) {
    return (
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Pipeline de Vendas</h1>
            <p className="text-muted-foreground">Gerencie seus leads e oportunidades de venda</p>
          </div>
          {pipeline?.id && (
            <Button variant="outline" onClick={() => setOpenStageConfig(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Configurar Etapas
            </Button>
          )}
        </div>
        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <div className="text-center">
            <p className="text-lg font-medium">Pipeline vazio!</p>
            <p className="text-sm text-muted-foreground mt-2">
              {pipeline?.id 
                ? "Clique em 'Configurar Etapas' para adicionar etapas ao pipeline."
                : "Configure seu pipeline em Configurações → Pipelines"
              }
            </p>
            {pipeline?.id && (
              <Button className="mt-4" onClick={() => setOpenStageConfig(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Configurar Etapas
              </Button>
            )}
          </div>
        </div>

        {/* Modal de Configuração de Etapas */}
        {pipeline?.id && (
          <StageConfigModal
            open={openStageConfig}
            onOpenChange={setOpenStageConfig}
            pipelineId={pipeline.id}
            pipelineName={pipeline.name || "Vendas"}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["vendas_pipeline"] });
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Pipeline de Vendas</h1>
          <p className="text-muted-foreground">Gerencie seus leads e oportunidades de venda</p>
        </div>
        <Button variant="outline" onClick={() => setOpenStageConfig(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Configurar Etapas
        </Button>
      </div>

      <KanbanBoard
        stages={stagesLegacy}
        cards={dealsLegacy}
        onCardClick={handleCardClick}
        onCardMove={handleCardMove}
        onAddCard={handleAddCard}
        isMoving={moveDealMutation.isPending}
        onCardMove={handleCardMove}
      />

      <Dialog open={openNewDeal} onOpenChange={setOpenNewDeal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
            <DialogDescription>Crie um novo lead de venda</DialogDescription>
          </DialogHeader>
          {pipeline && selectedStageId && (
            <DealForm
              pipelineId={pipeline.id}
              stageId={selectedStageId}
              onSuccess={() => {
                setOpenNewDeal(false);
                queryClient.invalidateQueries({ queryKey: ["deals"] });
              }}
              onCancel={() => setOpenNewDeal(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Deal */}
      <Dialog open={openDealDetails} onOpenChange={setOpenDealDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDeal?.title}</DialogTitle>
            <DialogDescription>
              Lead: {selectedDeal?.customer_name || "Cliente não informado"}
            </DialogDescription>
          </DialogHeader>

          {selectedDeal && <DealDetails dealId={selectedDeal.id} />}
        </DialogContent>
      </Dialog>

      {/* Modal de Configuração de Etapas */}
      <StageConfigModal
        open={openStageConfig}
        onOpenChange={setOpenStageConfig}
        pipelineId={pipeline.id}
        pipelineName={pipeline.name || "Vendas"}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["vendas_pipeline"] });
        }}
      />
    </div>
  );
};

export default Vendas;