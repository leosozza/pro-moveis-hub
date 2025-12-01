import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KanbanBoard, KanbanCard } from "@/components/KanbanBoard";
import { useQueryClient } from "@tanstack/react-query";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePipeline } from "@/modules/crm";
import { mapStageToLegacy } from "@/modules/crm/adapters/crm.adapters";
import { useServiceTickets, useCreateServiceTicket, useMoveTicket } from "@/modules/support";
import { useCustomersForSelection } from "@/modules/crm/hooks/useCustomers";
import { useProjectsForSelection } from "@/modules/projects";

const Assistencia = () => {
  const queryClient = useQueryClient();
  const [openNewTicket, setOpenNewTicket] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [selectedTicket, setSelectedTicket] = useState<KanbanCard | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    customer_id: "",
    project_id: "",
    priority: "media",
  });

  // Use CRM hooks for pipeline
  const { data: pipeline } = usePipeline('assistencia');
  
  // Use Support hooks for tickets
  const { ticketsLegacy, isLoading } = useServiceTickets(pipeline?.id);
  const createTicket = useCreateServiceTicket(pipeline?.id || '');
  const moveTicket = useMoveTicket();

  // Use hooks for customers and projects
  const { data: customers } = useCustomersForSelection();
  const { data: projects } = useProjectsForSelection();

  const handleCardMove = async (cardId: string, newStageId: string) => {
    try {
      await moveTicket.mutateAsync({ ticketId: cardId, newStageId });
      toast.success("Card movido com sucesso!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao mover card";
      toast.error(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStageId) {
      toast.error("Selecione um estágio");
      return;
    }
    
    try {
      await createTicket.mutateAsync({
        title: formData.title,
        description: formData.description,
        customerId: formData.customer_id,
        projectId: formData.project_id || undefined,
        stageId: selectedStageId,
        priority: formData.priority,
      });
      toast.success("Chamado criado com sucesso!");
      setOpenNewTicket(false);
      setFormData({
        title: "",
        description: "",
        customer_id: "",
        project_id: "",
        priority: "media",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar chamado");
    },
  });

  const moveTicketMutation = useMutation({
    mutationFn: async ({ cardId, newStageId }: { cardId: string; newStageId: string }) => {
      const { error } = await supabase
        .from("service_tickets")
        .update({ stage_id: newStageId })
        .eq("id", cardId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_tickets"] });
      toast.success("Card movido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao mover card");
    },
  });

  const handleCardMove = async (cardId: string, newStageId: string) => {
    await moveTicketMutation.mutateAsync({ cardId, newStageId });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStageId) {
      toast.error("Selecione um estágio");
      return;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar chamado";
      toast.error(errorMessage);
    }
  };

  const handleAddCard = (stageId: string) => {
    setSelectedStageId(stageId);
    setOpenNewTicket(true);
  };

  const handleCardClick = (card: KanbanCard) => {
    setSelectedTicket(card);
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
        <h1 className="text-3xl font-bold mb-2">Assistência Técnica</h1>
        <p className="text-muted-foreground">Gerencie chamados de suporte e manutenção</p>
      </div>

      {pipeline && (
        <KanbanBoard
          stages={pipeline.stages || []}
          cards={tickets || []}
          onCardClick={handleCardClick}
          onCardMove={handleCardMove}
          onAddCard={handleAddCard}
          isMoving={moveTicketMutation.isPending}
          stages={stagesLegacy}
          cards={ticketsLegacy}
          onCardClick={setSelectedTicket}
          onAddCard={handleAddCard}
          onCardMove={handleCardMove}
        />
      )}

      <Dialog open={openNewTicket} onOpenChange={setOpenNewTicket}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Chamado</DialogTitle>
            <DialogDescription>Registre um novo chamado de assistência</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Cliente *</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Projeto</Label>
              <Select
                value={formData.project_id}
                onValueChange={(value) => setFormData({ ...formData, project_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenNewTicket(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createTicket.isPending}>
                {createTicket.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assistencia;