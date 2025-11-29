import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const PipelineTunnelConfig = () => {
  const queryClient = useQueryClient();
  const [openNewTunnel, setOpenNewTunnel] = useState(false);
  const [tunnelData, setTunnelData] = useState({
    source_stage_id: "",
    target_pipeline_id: "",
    target_stage_id: "",
    action_type: "copy",
  });

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
    queryKey: ["all_stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stages")
        .select("*, pipelines:pipeline_id(name)")
        .order("position");
      if (error) throw error;
      return data;
    },
  });

  const { data: tunnels } = useQuery({
    queryKey: ["pipeline_tunnels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_tunnels")
        .select(`
          *,
          source_stage:source_stage_id(name, pipelines:pipeline_id(name)),
          target_pipeline:target_pipeline_id(name),
          target_stage:target_stage_id(name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createTunnel = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      const { error } = await supabase.from("pipeline_tunnels").insert([{
        ...tunnelData,
        company_id: profile?.company_id,
        target_stage_id: tunnelData.target_stage_id || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline_tunnels"] });
      toast.success("Túnel criado!");
      setOpenNewTunnel(false);
      setTunnelData({
        source_stage_id: "",
        target_pipeline_id: "",
        target_stage_id: "",
        action_type: "copy",
      });
    },
  });

  const deleteTunnel = useMutation({
    mutationFn: async (tunnelId: string) => {
      const { error } = await supabase.from("pipeline_tunnels").delete().eq("id", tunnelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline_tunnels"] });
      toast.success("Túnel removido!");
    },
  });

  const getTargetStages = () => {
    if (!tunnelData.target_pipeline_id) return [];
    return stages?.filter(s => s.pipeline_id === tunnelData.target_pipeline_id) || [];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Túneis de Pipeline</CardTitle>
              <CardDescription>Configure transições automáticas entre pipelines</CardDescription>
            </div>
            <Button onClick={() => setOpenNewTunnel(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Túnel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tunnels?.map((tunnel: any) => (
              <div key={tunnel.id} className="flex items-center justify-between p-4 border rounded">
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <p className="font-medium">
                      {tunnel.source_stage?.pipelines?.name} → {tunnel.source_stage?.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {tunnel.action_type === 'copy' ? '📋 Copiar' : '➡️ Mover'}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">{tunnel.target_pipeline?.name}</p>
                    {tunnel.target_stage && (
                      <p className="text-xs text-muted-foreground">→ {tunnel.target_stage.name}</p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Tem certeza que deseja remover este túnel?")) {
                      deleteTunnel.mutate(tunnel.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {tunnels?.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhum túnel configurado
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Novo Túnel */}
      <Dialog open={openNewTunnel} onOpenChange={setOpenNewTunnel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Túnel de Pipeline</DialogTitle>
            <DialogDescription>
              Configure transições automáticas entre etapas e pipelines
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Etapa de Origem</Label>
              <Select
                value={tunnelData.source_stage_id}
                onValueChange={(v) => setTunnelData({ ...tunnelData, source_stage_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a etapa de origem" />
                </SelectTrigger>
                <SelectContent>
                  {stages?.map((stage: any) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.pipelines?.name} → {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Pipeline de Destino</Label>
              <Select
                value={tunnelData.target_pipeline_id}
                onValueChange={(v) => setTunnelData({ ...tunnelData, target_pipeline_id: v, target_stage_id: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o pipeline de destino" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines?.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {tunnelData.target_pipeline_id && (
              <div>
                <Label>Etapa de Destino (Opcional)</Label>
                <Select
                  value={tunnelData.target_stage_id}
                  onValueChange={(v) => setTunnelData({ ...tunnelData, target_stage_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Primeira etapa do pipeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {getTargetStages().map((stage: any) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Ação</Label>
              <Select
                value={tunnelData.action_type}
                onValueChange={(v) => setTunnelData({ ...tunnelData, action_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="copy">Copiar Deal</SelectItem>
                  <SelectItem value="move">Mover Deal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => createTunnel.mutate()}
              disabled={!tunnelData.source_stage_id || !tunnelData.target_pipeline_id || createTunnel.isPending}
              className="w-full"
            >
              Criar Túnel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};