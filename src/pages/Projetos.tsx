import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, FileText, Loader2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const Projetos = () => {
  const queryClient = useQueryClient();
  const [openNewProject, setOpenNewProject] = useState(false);
  const [openUploadXML, setOpenUploadXML] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    customer_id: "",
    description: "",
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

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          customers:customer_id(name),
          profiles:projetista_id(full_name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createProject = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();
      
      if (!profile) throw new Error("Perfil não encontrado");
      
      const { error } = await supabase.from("projects").insert([{
        ...data,
        company_id: profile.company_id,
        projetista_id: user.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projeto criado com sucesso!");
      setOpenNewProject(false);
      setFormData({ name: "", customer_id: "", description: "" });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar projeto");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject.mutate(formData);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedProject) return;

    setUploading(true);
    const files = Array.from(e.target.files);
    let successCount = 0;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("Perfil não encontrado");

      for (const file of files) {
        if (!file.name.endsWith('.xml')) {
          toast.error(`${file.name} não é um arquivo XML válido`);
          continue;
        }

        // Extrair ID do cliente e ambiente do nome do arquivo
        const nameParts = file.name.replace('.xml', '').split('_');
        if (nameParts.length < 2) {
          toast.error(`Nome do arquivo ${file.name} inválido. Use formato: idCliente_ambiente.xml`);
          continue;
        }

        const customerId = nameParts[0];
        const ambiente = nameParts.slice(1).join('_');

        // Upload do arquivo
        const filePath = `${profile.company_id}/${selectedProject}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        // Registrar no banco
        const { data: promobFile, error: dbError } = await supabase
          .from('promob_files')
          .insert([{
            company_id: profile.company_id,
            project_id: selectedProject,
            customer_id: customerId,
            ambiente: ambiente,
            file_path: filePath,
            original_filename: file.name,
            uploaded_by: user.id,
          }])
          .select()
          .single();

        if (dbError) throw dbError;

        // Processar XML via edge function
        try {
          const { data: processResult, error: processError } = await supabase.functions.invoke('process-xml', {
            body: { promob_file_id: promobFile.id }
          });

          if (processError) {
            console.error('Erro ao processar XML:', processError);
            toast.error(`${file.name}: Erro ao processar XML`);
          } else {
            successCount++;
            toast.success(`${file.name}: ${processResult.items_count} itens processados`);
          }
        } catch (err) {
          console.error('Erro ao chamar função:', err);
          toast.error(`${file.name}: Erro ao processar`);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} arquivo(s) processado(s)! Verifique a aba Orçamentos.`);
      }
      setOpenUploadXML(false);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer upload");
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" }> = {
      em_elaboracao: { label: "Em Elaboração", variant: "default" },
      aguardando_aprovacao: { label: "Aguardando Aprovação", variant: "secondary" },
      aprovado: { label: "Aprovado", variant: "success" },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "default" };
    return <Badge variant={statusInfo.variant as any}>{statusInfo.label}</Badge>;
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
          projects?.map((project: any) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>
                      Cliente: {project.customers?.name} • 
                      Projetista: {project.profiles?.full_name}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(project.status)}
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedProject(project.id);
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
