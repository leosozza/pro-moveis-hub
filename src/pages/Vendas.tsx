import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { DealForm } from "@/components/DealForm";
import { DealDetails } from "@/components/DealDetails";

const Vendas = () => {
  const queryClient = useQueryClient();
  const [openNewDeal, setOpenNewDeal] = useState(false);
  const [openDealDetails, setOpenDealDetails] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [selectedDeal, setSelectedDeal] = useState<any>(null);

  const { data: pipeline } = useQuery({
    queryKey: ["vendas_pipeline"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipelines")
        .select("*, stages(*)")
        .eq("type", "vendas")
        .single();
      if (error) throw error;
      
      // Ordenar stages por position
      if (data?.stages) {
        data.stages = data.stages.sort((a: any, b: any) => a.position - b.position);
      }
      
      return data;
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

  const handleAddCard = (stageId: string) => {
    setSelectedStageId(stageId);
    setOpenNewDeal(true);
  };

  const handleCardClick = (deal: any) => {
    setSelectedDeal(deal);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Pipeline de Vendas</h1>
          <p className="text-muted-foreground">Gerencie seus leads e oportunidades de venda</p>
        </div>
        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <div className="text-center">
            <p className="text-lg font-medium">Pipeline vazio!</p>
            <p className="text-sm text-muted-foreground mt-2">
              Configure seu pipeline em Configurações → Pipelines
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pipeline de Vendas</h1>
        <p className="text-muted-foreground">Gerencie seus leads e oportunidades de venda</p>
      </div>

      <KanbanBoard
        stages={pipeline.stages}
        cards={deals || []}
        onCardClick={handleCardClick}
        onAddCard={handleAddCard}
        tableName="deals"
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
    </div>
  );
};

export default Vendas;