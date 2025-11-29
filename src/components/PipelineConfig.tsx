import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { GripVertical, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const PipelineConfig = () => {
  const queryClient = useQueryClient();
  const [selectedPipeline, setSelectedPipeline] = useState<string>("");
  const [openNewStage, setOpenNewStage] = useState(false);
  const [openEditStage, setOpenEditStage] = useState(false);
  const [editingStage, setEditingStage] = useState<any>(null);

  const { data: pipelines } = useQuery({
    queryKey: ["pipelines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipelines")
        .select("*")
        .order("type");
      if (error) throw error;
      return data;
    },
  });

  const { data: stages } = useQuery({
    queryKey: ["stages", selectedPipeline],
    queryFn: async () => {
      if (!selectedPipeline) return [];
      const { data, error } = await supabase
        .from("stages")
        .select("*")
        .eq("pipeline_id", selectedPipeline)
        .order("position");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPipeline,
  });

  const createStage = useMutation({
    mutationFn: async (formData: FormData) => {
      const name = formData.get("name") as string;
      const color = formData.get("color") as string;
      const isWin = formData.get("is_win") === "on";
      const isLoss = formData.get("is_loss") === "on";

      const maxPosition = stages?.length ? Math.max(...stages.map(s => s.position)) : 0;

      const { error } = await supabase.from("stages").insert([{
        pipeline_id: selectedPipeline,
        name,
        color,
        position: maxPosition + 1,
        is_win_stage: isWin,
        is_loss_stage: isLoss,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stages", selectedPipeline] });
      toast.success("Etapa criada!");
      setOpenNewStage(false);
    },
  });

  const updateStage = useMutation({
    mutationFn: async (formData: FormData) => {
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
      queryClient.invalidateQueries({ queryKey: ["stages", selectedPipeline] });
      toast.success("Etapa atualizada!");
      setOpenEditStage(false);
      setEditingStage(null);
    },
  });

  const deleteStage = useMutation({
    mutationFn: async (stageId: string) => {
      const { error } = await supabase.from("stages").delete().eq("id", stageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stages", selectedPipeline] });
      toast.success("Etapa removida!");
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Etapas do Kanban</CardTitle>
          <CardDescription>Personalize as etapas de cada pipeline</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Selecione o Pipeline</Label>
            <select
              className="w-full border rounded px-3 py-2"
              value={selectedPipeline}
              onChange={(e) => setSelectedPipeline(e.target.value)}
            >
              <option value="">Selecione...</option>
              {pipelines?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedPipeline && (
            <>
              <div className="flex justify-end">
                <Button onClick={() => setOpenNewStage(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Etapa
                </Button>
              </div>

              <div className="space-y-2">
                {stages?.map((stage) => (
                  <div key={stage.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: stage.color }}
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
                        onClick={() => {
                          if (confirm("Tem certeza que deseja remover esta etapa?")) {
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
            </>
          )}
        </CardContent>
      </Card>

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
                <Label>Nome da Etapa</Label>
                <Input name="name" required />
              </div>
              <div>
                <Label>Cor</Label>
                <Input name="color" type="color" defaultValue="#3b82f6" />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox name="is_win" id="is_win" />
                <Label htmlFor="is_win">Etapa de Ganho</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox name="is_loss" id="is_loss" />
                <Label htmlFor="is_loss">Etapa de Perda</Label>
              </div>
              <Button type="submit" className="w-full">Criar Etapa</Button>
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
                  <Label>Nome da Etapa</Label>
                  <Input name="name" defaultValue={editingStage.name} required />
                </div>
                <div>
                  <Label>Cor</Label>
                  <Input name="color" type="color" defaultValue={editingStage.color} />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox name="is_win" id="edit_is_win" defaultChecked={editingStage.is_win_stage} />
                  <Label htmlFor="edit_is_win">Etapa de Ganho</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox name="is_loss" id="edit_is_loss" defaultChecked={editingStage.is_loss_stage} />
                  <Label htmlFor="edit_is_loss">Etapa de Perda</Label>
                </div>
                <Button type="submit" className="w-full">Salvar Alterações</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};