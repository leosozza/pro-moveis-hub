import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { GripVertical, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Stage {
  id: string;
  name: string;
  position: number;
  color: string;
  is_win_stage?: boolean;
  is_loss_stage?: boolean;
}

interface StageConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId: string;
  pipelineName: string;
  onSuccess?: () => void;
}

export const StageConfigModal = ({
  open,
  onOpenChange,
  pipelineId,
  pipelineName,
  onSuccess,
}: StageConfigModalProps) => {
  const queryClient = useQueryClient();
  const [openNewStage, setOpenNewStage] = useState(false);
  const [openEditStage, setOpenEditStage] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);

  const { data: stages, isLoading } = useQuery({
    queryKey: ["pipeline_stages", pipelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stages")
        .select("*")
        .eq("pipeline_id", pipelineId)
        .order("position");
      if (error) throw error;
      return data as Stage[];
    },
    enabled: !!pipelineId && open,
  });

  const createStage = useMutation({
    mutationFn: async (formData: FormData) => {
      const name = formData.get("name") as string;
      const color = formData.get("color") as string;
      const isWin = formData.get("is_win") === "on";
      const isLoss = formData.get("is_loss") === "on";

      const maxPosition = stages?.length ? Math.max(...stages.map(s => s.position)) : 0;

      const { error } = await supabase.from("stages").insert([{
        pipeline_id: pipelineId,
        name,
        color,
        position: maxPosition + 1,
        is_win_stage: isWin,
        is_loss_stage: isLoss,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline_stages", pipelineId] });
      toast.success("Etapa criada com sucesso!");
      setOpenNewStage(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar etapa");
    },
  });

  const updateStage = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!editingStage) return;
      
      const name = formData.get("name") as string;
      const color = formData.get("color") as string;
      const isWin = formData.get("is_win") === "on";
      const isLoss = formData.get("is_loss") === "on";

      const { error } = await supabase
        .from("stages")
        .update({
          name,
          color,
          is_win_stage: isWin,
          is_loss_stage: isLoss,
        })
        .eq("id", editingStage.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline_stages", pipelineId] });
      toast.success("Etapa atualizada com sucesso!");
      setOpenEditStage(false);
      setEditingStage(null);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar etapa");
    },
  });

  const deleteStage = useMutation({
    mutationFn: async (stageId: string) => {
      const { error } = await supabase.from("stages").delete().eq("id", stageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline_stages", pipelineId] });
      toast.success("Etapa removida com sucesso!");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover etapa");
    },
  });

  const moveStage = useMutation({
    mutationFn: async ({ stageId, direction }: { stageId: string; direction: "up" | "down" }) => {
      if (!stages) return;
      
      const currentIndex = stages.findIndex(s => s.id === stageId);
      if (currentIndex === -1) return;
      
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= stages.length) return;
      
      const currentStage = stages[currentIndex];
      const targetStage = stages[targetIndex];
      
      // Swap positions
      const updates = [
        supabase
          .from("stages")
          .update({ position: targetStage.position })
          .eq("id", currentStage.id),
        supabase
          .from("stages")
          .update({ position: currentStage.position })
          .eq("id", targetStage.id),
      ];
      
      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline_stages", pipelineId] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao reordenar etapa");
    },
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Etapas - {pipelineName}</DialogTitle>
            <DialogDescription>
              Adicione, edite, reordene ou remova etapas do pipeline
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setOpenNewStage(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Etapa
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : stages?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma etapa configurada. Clique em "Nova Etapa" para começar.
              </div>
            ) : (
              <div className="space-y-2">
                {stages?.map((stage, index) => (
                  <div 
                    key={stage.id} 
                    className="flex items-center justify-between p-3 border rounded-lg bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          disabled={index === 0 || moveStage.isPending}
                          onClick={() => moveStage.mutate({ stageId: stage.id, direction: "up" })}
                        >
                          <span className="text-xs">▲</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          disabled={index === stages.length - 1 || moveStage.isPending}
                          onClick={() => moveStage.mutate({ stageId: stage.id, direction: "down" })}
                        >
                          <span className="text-xs">▼</span>
                        </Button>
                      </div>
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: stage.color || "#3b82f6" }}
                      />
                      <div>
                        <p className="font-medium">{stage.name}</p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          {stage.is_win_stage && <span className="text-green-600">✓ Ganho</span>}
                          {stage.is_loss_stage && <span className="text-red-600">✗ Perda</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingStage(stage);
                          setOpenEditStage(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={deleteStage.isPending}
                        onClick={() => {
                          if (confirm("Tem certeza que deseja remover esta etapa? Cards nesta etapa podem ser afetados.")) {
                            deleteStage.mutate(stage.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Nova Etapa */}
      <Dialog open={openNewStage} onOpenChange={setOpenNewStage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Etapa</DialogTitle>
            <DialogDescription>Adicione uma nova etapa ao pipeline</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            createStage.mutate(new FormData(e.currentTarget));
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new_name">Nome da Etapa</Label>
                <Input id="new_name" name="name" required />
              </div>
              <div>
                <Label htmlFor="new_color">Cor</Label>
                <Input id="new_color" name="color" type="color" defaultValue="#3b82f6" />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox name="is_win" id="new_is_win" />
                <Label htmlFor="new_is_win">Etapa de Ganho</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox name="is_loss" id="new_is_loss" />
                <Label htmlFor="new_is_loss">Etapa de Perda</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenNewStage(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createStage.isPending}>
                  {createStage.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Etapa
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Etapa */}
      <Dialog open={openEditStage} onOpenChange={setOpenEditStage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Etapa</DialogTitle>
            <DialogDescription>Altere as propriedades da etapa</DialogDescription>
          </DialogHeader>
          {editingStage && (
            <form onSubmit={(e) => {
              e.preventDefault();
              updateStage.mutate(new FormData(e.currentTarget));
            }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit_name">Nome da Etapa</Label>
                  <Input id="edit_name" name="name" defaultValue={editingStage.name} required />
                </div>
                <div>
                  <Label htmlFor="edit_color">Cor</Label>
                  <Input id="edit_color" name="color" type="color" defaultValue={editingStage.color || "#3b82f6"} />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox name="is_win" id="edit_is_win" defaultChecked={editingStage.is_win_stage} />
                  <Label htmlFor="edit_is_win">Etapa de Ganho</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox name="is_loss" id="edit_is_loss" defaultChecked={editingStage.is_loss_stage} />
                  <Label htmlFor="edit_is_loss">Etapa de Perda</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpenEditStage(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateStage.isPending}>
                    {updateStage.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
