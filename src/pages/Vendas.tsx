import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, FolderKanban, FileText, Plus, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Vendas = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [openNewDeal, setOpenNewDeal] = useState(false);
  const [openDealDetails, setOpenDealDetails] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    customer_id: "",
    project_id: "",
    estimated_value: "",
    expected_close_date: "",
  });

  const { data: pipeline } = useQuery({
    queryKey: ["vendas_pipeline"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipelines")
        .select("*, stages(*)")
        .eq("type", "vendas")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: deals, isLoading } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          customers:customer_id(name),
          projects:project_id(name),
          profiles:responsible_id(full_name)
        `)
        .eq("pipeline_id", pipeline?.id)
        .order("position");
      if (error) throw error;
      return data;
    },
    enabled: !!pipeline?.id,
  });

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

  const createDeal = useMutation({
    mutationFn: async (data: typeof formData & { stage_id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();
      
      const { error } = await supabase.from("deals").insert([{
        ...data,
        company_id: profile?.company_id,
        pipeline_id: pipeline?.id,
        responsible_id: user.id,
        estimated_value: data.estimated_value ? parseFloat(data.estimated_value) : null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal criado com sucesso!");
      setOpenNewDeal(false);
      setFormData({
        title: "",
        description: "",
        customer_id: "",
        project_id: "",
        estimated_value: "",
        expected_close_date: "",
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar deal");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStageId) {
      toast.error("Selecione um estágio");
      return;
    }
    createDeal.mutate({ ...formData, stage_id: selectedStageId });
  };

  const handleAddCard = (stageId: string) => {
    setSelectedStageId(stageId);
    setOpenNewDeal(true);
  };

  const handleCardClick = (deal: any) => {
    setSelectedDeal(deal);
    setOpenDealDetails(true);
  };

  // Buscar projetos do cliente quando um deal é selecionado
  const { data: customerProjects } = useQuery({
    queryKey: ["customer_projects", selectedDeal?.customer_id],
    queryFn: async () => {
      if (!selectedDeal?.customer_id) return [];
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          profiles:projetista_id(full_name)
        `)
        .eq("customer_id", selectedDeal.customer_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedDeal?.customer_id,
  });

  // Buscar orçamentos dos projetos do cliente
  const { data: customerBudgets } = useQuery({
    queryKey: ["customer_budgets", selectedDeal?.customer_id],
    queryFn: async () => {
      if (!selectedDeal?.customer_id) return [];
      const { data, error } = await supabase
        .from("budgets")
        .select(`
          *,
          projects:project_id(name)
        `)
        .eq("customer_id", selectedDeal.customer_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedDeal?.customer_id,
  });

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pipeline de Vendas</h1>
        <p className="text-muted-foreground">Gerencie seus leads e oportunidades de venda</p>
      </div>

      {pipeline && (
        <KanbanBoard
          stages={pipeline.stages || []}
          cards={deals || []}
          onCardClick={handleCardClick}
          onAddCard={handleAddCard}
          tableName="deals"
        />
      )}

      <Dialog open={openNewDeal} onOpenChange={setOpenNewDeal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Deal</DialogTitle>
            <DialogDescription>Crie uma nova oportunidade de venda</DialogDescription>
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
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor Estimado</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.estimated_value}
                  onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                />
              </div>
              <div>
                <Label>Data Prevista</Label>
                <Input
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenNewDeal(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createDeal.isPending}>
                {createDeal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Deal */}
      <Dialog open={openDealDetails} onOpenChange={setOpenDealDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDeal?.title}</DialogTitle>
            <DialogDescription>
              Cliente: {selectedDeal?.customers?.name} • 
              Responsável: {selectedDeal?.profiles?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações do Deal */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Deal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedDeal?.description && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Descrição</Label>
                    <p className="text-sm">{selectedDeal.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {selectedDeal?.estimated_value && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Valor Estimado</Label>
                      <p className="text-sm font-medium">{formatCurrency(selectedDeal.estimated_value)}</p>
                    </div>
                  )}
                  {selectedDeal?.expected_close_date && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Data Prevista</Label>
                      <p className="text-sm">{new Date(selectedDeal.expected_close_date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabs de Projetos e Orçamentos */}
            <Tabs defaultValue="projects" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="projects">
                  <FolderKanban className="h-4 w-4 mr-2" />
                  Projetos ({customerProjects?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="budgets">
                  <FileText className="h-4 w-4 mr-2" />
                  Orçamentos ({customerBudgets?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="projects" className="space-y-4 mt-4">
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => {
                      navigate('/projetos');
                      setOpenDealDetails(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Projeto
                  </Button>
                </div>

                {customerProjects?.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <FolderKanban className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhum projeto vinculado</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {customerProjects?.map((project: any) => (
                      <Card key={project.id} className="hover:border-primary transition-colors cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{project.name}</CardTitle>
                              <CardDescription className="text-xs">
                                Projetista: {project.profiles?.full_name || "Não atribuído"}
                              </CardDescription>
                            </div>
                            <Badge variant={project.status === "aprovado" ? "default" : "secondary"}>
                              {project.status || "Em elaboração"}
                            </Badge>
                          </div>
                        </CardHeader>
                        {project.description && (
                          <CardContent className="pt-0">
                            <p className="text-xs text-muted-foreground">{project.description}</p>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="budgets" className="space-y-4 mt-4">
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => {
                      navigate('/orcamentos');
                      setOpenDealDetails(false);
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Orçamentos
                  </Button>
                </div>

                {customerBudgets?.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhum orçamento gerado</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Faça upload de XMLs na área de Projetos
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {customerBudgets?.map((budget: any) => (
                      <Card key={budget.id} className="hover:border-primary transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{budget.projects?.name}</CardTitle>
                              <CardDescription className="text-xs">
                                Versão {budget.version} • {new Date(budget.created_at).toLocaleDateString('pt-BR')}
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">
                                {formatCurrency(budget.total_preco)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Custo: {formatCurrency(budget.total_custo)}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        {budget.observacoes && (
                          <CardContent className="pt-0">
                            <p className="text-xs text-muted-foreground">{budget.observacoes}</p>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vendas;