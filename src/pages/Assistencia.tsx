import { useState, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { usePipelineByType } from "@/modules/crm/hooks/usePipelines";
import { useServiceTickets } from "@/modules/support/hooks/useServiceTickets";
import { useMoveTicket } from "@/modules/support/hooks/useMoveTicket";
import { createTicket } from "@/modules/support/services/support.service";
import { supabase } from "@/integrations/supabase/client";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ServiceTicket, TicketPriority } from "@/modules/support/types/support.types";

const Assistencia = () => {
  const queryClient = useQueryClient();
  const [openNewTicket, setOpenNewTicket] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    customer_id: "",
    project_id: "",
    priority: "media" as TicketPriority,
  });

  const { pipeline, isLoading: pipelineLoading } = usePipelineByType('assistencia');
  const { tickets, isLoading: ticketsLoading } = useServiceTickets(pipeline?.id);
  const { moveTicket, isLoading: movingTicket } = useMoveTicket();

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: typeof formData & { stage_id: string }) => {
      if (!pipeline?.id) throw new Error("Pipeline não encontrado");
      return createTicket({
        ...data,
        pipeline_id: pipeline.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_tickets"] });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStageId) {
      toast.error("Selecione um estágio");
      return;
    }
    createTicketMutation.mutate({ ...formData, stage_id: selectedStageId });
  };

  const handleAddCard = (stageId: string) => {
    setSelectedStageId(stageId);
    setOpenNewTicket(true);
  };

  const handleCardMove = async (cardId: string, newStageId: string) => {
    await moveTicket(cardId, newStageId);
  };

  // Map tickets to KanbanCard format
  const kanbanCards = useMemo(() => tickets.map(ticket => ({
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    stage_id: ticket.stage_id,
    position: ticket.position,
    customers: ticket.customers,
    priority: ticket.priority || undefined,
  })), [tickets]);

  if (pipelineLoading || ticketsLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Assistência Técnica</h1>
        <p className="text-muted-foreground">Gerencie chamados de suporte e manutenção</p>
      </div>

      {pipeline && (
        <KanbanBoard
          stages={pipeline.stages || []}
          cards={kanbanCards}
          onCardClick={(card) => setSelectedTicket(tickets.find(t => t.id === card.id) || null)}
          onAddCard={handleAddCard}
          onCardMove={handleCardMove}
          isMoving={movingTicket}
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
              <Button type="submit" disabled={createTicketMutation.isPending}>
                {createTicketMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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