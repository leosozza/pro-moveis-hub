import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KanbanBoard, KanbanCard } from "@/components/KanbanBoard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Settings } from "lucide-react";
import { DealForm } from "@/components/DealForm";
import { DealDetails } from "@/components/DealDetails";
import { StageConfigModal } from "@/components/StageConfigModal";
import { toast } from "sonner";

const Vendas = () => {
  const queryClient = useQueryClient();
  const [openNewDeal, setOpenNewDeal] = useState(false);
  const [openDealDetails, setOpenDealDetails] = useState(false);
  const [openStageConfig, setOpenStageConfig] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [selectedDeal, setSelectedDeal] = useState<{ id: string; title: string; customer_name?: string } | null>(null);

  const { data: pipeline } = useQuery({
    queryKey: ["vendas_pipeline"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipelines")
        .select("*, stages(*)")
        .eq("type", "vendas")
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
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("pipeline_id", pipeline?.id)
        .order("position");
      if (error) throw error;
      return data?.map(d => ({
        ...d,
        customers: d.customer_name ? { name: d.customer_name } : null,
      }));
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
        stages={pipeline.stages}
        cards={deals || []}
        onCardClick={handleCardClick}
        onCardMove={handleCardMove}
        onAddCard={handleAddCard}
        isMoving={moveDealMutation.isPending}
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