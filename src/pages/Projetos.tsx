import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, Loader2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useProjects, useCreateProject } from "@/modules/projects";
import { useCustomersForSelection } from "@/modules/crm/hooks/useCustomers";
import { xmlService } from "@/modules/projects/services/xml.service";

const Projetos = () => {
  const queryClient = useQueryClient();
  const [openNewProject, setOpenNewProject] = useState(false);
  const [openUploadXML, setOpenUploadXML] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedProjectCustomerId, setSelectedProjectCustomerId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    customer_id: "",
    description: "",
  });

  // Use hooks
  const { data: customers } = useCustomersForSelection();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProject.mutateAsync({
        name: formData.name,
        customerId: formData.customer_id,
        description: formData.description || undefined,
      });
      toast.success("Projeto criado com sucesso!");
      setOpenNewProject(false);
      setFormData({ name: "", customer_id: "", description: "" });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar projeto";
      toast.error(errorMessage);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedProject || !selectedProjectCustomerId) return;

    setUploading(true);
    const files = Array.from(e.target.files);
    let successCount = 0;

    try {
      for (const file of files) {
        if (!file.name.endsWith('.xml')) {
          toast.error(`${file.name} não é um arquivo XML válido`);
          continue;
        }

        // Validate file name format
        const validation = xmlService.validateFileName(file.name);
        if (!validation.isValid) {
          toast.error(`Nome do arquivo ${file.name} inválido. Use formato: idCliente_ambiente.xml`);
          continue;
        }

        try {
          const result = await xmlService.uploadAndProcessXml(
            file,
            selectedProject,
            selectedProjectCustomerId
          );
          successCount++;
          toast.success(`${file.name}: ${result.itemsCount} itens processados`);
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
          console.error('Erro ao processar XML:', err);
          toast.error(`${file.name}: ${errorMessage}`);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} arquivo(s) processado(s)! Verifique a aba Orçamentos.`);
      }
      setOpenUploadXML(false);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao fazer upload";
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary"; isApproved?: boolean }> = {
      em_elaboracao: { label: "Em Elaboração", variant: "default" },
      aguardando_aprovacao: { label: "Aguardando Aprovação", variant: "secondary" },
      aprovado: { label: "Aprovado", variant: "default", isApproved: true },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "default" };
    return (
      <Badge 
        variant={statusInfo.variant}
        className={statusInfo.isApproved ? 'bg-green-600 hover:bg-green-700' : undefined}
      >
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projetos</h1>
          <p className="text-muted-foreground">Área do projetista - Gerencie seus projetos e uploads de XML</p>
        </div>
        <Button onClick={() => setOpenNewProject(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Projeto
        </Button>
      </div>

      <Dialog open={openNewProject} onOpenChange={setOpenNewProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Projeto</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo projeto
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Projeto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="customer">Cliente *</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenNewProject(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openUploadXML} onOpenChange={setOpenUploadXML}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload de XMLs do Promob</DialogTitle>
            <DialogDescription>
              Selecione os arquivos XML para upload
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Formato do nome do arquivo:</h4>
              <code className="text-sm bg-background px-2 py-1 rounded">
                idCliente_ambiente.xml
              </code>
              <p className="text-sm text-muted-foreground mt-2">
                Exemplo: 123_cozinha.xml, 456_quarto.xml
              </p>
            </div>
            <div>
              <Label htmlFor="xml-files">Selecionar XMLs</Label>
              <Input
                id="xml-files"
                type="file"
                multiple
                accept=".xml"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </div>
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando arquivos...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : projects?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum projeto cadastrado</p>
              <Button onClick={() => setOpenNewProject(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Projeto
              </Button>
            </CardContent>
          </Card>
        ) : (
          projects?.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>
                      Cliente: {project.customer?.name} • 
                      Projetista: {project.projetista?.fullName}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(project.status || 'em_elaboracao')}
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedProject(project.id);
                        setSelectedProjectCustomerId(project.customerId);
                        setOpenUploadXML(true);
                      }}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload XML
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {project.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Projetos;
