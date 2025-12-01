import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePipelineByType } from "@/modules/crm/hooks/usePipelines";
import { useDeals } from "@/modules/crm/hooks/useDeals";
import { useMoveDeal } from "@/modules/crm/hooks/useMoveDeal";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Settings } from "lucide-react";
import { DealForm } from "@/components/DealForm";
import { DealDetails } from "@/components/DealDetails";
import { StageConfigModal } from "@/components/StageConfigModal";

const Vendas = () => {
  const queryClient = useQueryClient();
  const [openNewDeal, setOpenNewDeal] = useState(false);
  const [openDealDetails, setOpenDealDetails] = useState(false);
  const [openStageConfig, setOpenStageConfig] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [selectedDeal, setSelectedDeal] = useState<{ id: string; title: string; customer_name?: string } | null>(null);

  const { pipeline, isLoading: pipelineLoading } = usePipelineByType('vendas');
  const { deals, isLoading: dealsLoading } = useDeals(pipeline?.id);
  const { moveDeal, isLoading: movingDeal } = useMoveDeal(pipeline?.id);

  const handleAddCard = (stageId: string) => {
    setSelectedStageId(stageId);
    setOpenNewDeal(true);
  };

  const handleCardClick = (deal: { id: string; title: string; customer_name?: string }) => {
    setSelectedDeal(deal);
    setOpenDealDetails(true);
  };

  const handleCardMove = async (cardId: string, newStageId: string) => {
    try {
      await moveDeal(cardId, newStageId);
    } catch (error) {
      // Error already handled by hook with toast
      console.error('Failed to move deal:', error);
    }
  };

  // Map deals to include customers property for KanbanBoard compatibility
  const mappedDeals = useMemo(() => (deals || []).map(d => ({
    ...d,
    customers: d.customer_name ? { name: d.customer_name } : d.customers,
  })), [deals]);

  if (pipelineLoading || dealsLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
              queryClient.invalidateQueries({ queryKey: ["pipeline", "vendas"] });
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
        stages={pipeline.stages}
        cards={mappedDeals}
        onCardClick={handleCardClick}
        onAddCard={handleAddCard}
        onCardMove={handleCardMove}
        isMoving={movingDeal}
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
          queryClient.invalidateQueries({ queryKey: ["pipeline", "vendas"] });
        }}
      />
    </div>
  );
};

export default Vendas;