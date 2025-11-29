import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, MessageSquare, DollarSign, Upload, Loader2, FileUp, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface DealDetailsProps {
  dealId: string;
}

export const DealDetails = ({ dealId }: DealDetailsProps) => {
  const queryClient = useQueryClient();
  const [newInteraction, setNewInteraction] = useState({ type: "", content: "" });
  const [uploadingFile, setUploadingFile] = useState(false);

  const { data: deal } = useQuery({
    queryKey: ["deal", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("id", dealId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: attachments } = useQuery({
    queryKey: ["deal_attachments", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_attachments")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: interactions } = useQuery({
    queryKey: ["deal_interactions", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_interactions")
        .select(`
          *,
          profiles:user_id(full_name)
        `)
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addInteraction = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from("deal_interactions").insert([{
        deal_id: dealId,
        user_id: user.id,
        interaction_type: newInteraction.type,
        content: newInteraction.content,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal_interactions", dealId] });
      toast.success("Interação registrada!");
      setNewInteraction({ type: "", content: "" });
    },
  });

  const uploadFile = async (file: File, fileType: string) => {
    setUploadingFile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const fileExt = file.name.split('.').pop();
      const fileName = `${dealId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("deal_attachments").insert([{
        deal_id: dealId,
        file_type: fileType,
        file_url: publicUrl,
        original_filename: file.name,
      }]);

      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["deal_attachments", dealId] });
      toast.success("Arquivo enviado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar arquivo");
    } finally {
      setUploadingFile(false);
    }
  };

  const deleteAttachment = useMutation({
    mutationFn: async (attachmentId: string) => {
      const { error } = await supabase
        .from("deal_attachments")
        .delete()
        .eq("id", attachmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal_attachments", dealId] });
      toast.success("Arquivo removido!");
    },
  });

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'xml') return <FileText className="h-5 w-5 text-blue-500" />;
    if (fileType === 'imagem') return <ImageIcon className="h-5 w-5 text-green-500" />;
    return <FileUp className="h-5 w-5 text-gray-500" />;
  };

  return (
    <Tabs defaultValue="resumo" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="resumo">
          <FileText className="h-4 w-4 mr-2" />
          Resumo
        </TabsTrigger>
        <TabsTrigger value="arquivos">
          <Upload className="h-4 w-4 mr-2" />
          Arquivos ({attachments?.length || 0})
        </TabsTrigger>
        <TabsTrigger value="historico">
          <MessageSquare className="h-4 w-4 mr-2" />
          Histórico ({interactions?.length || 0})
        </TabsTrigger>
        <TabsTrigger value="negociacao">
          <DollarSign className="h-4 w-4 mr-2" />
          Negociação
        </TabsTrigger>
      </TabsList>

      <TabsContent value="resumo" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <p className="text-sm font-medium">{deal?.customer_name || "Não informado"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Telefone/WhatsApp</Label>
              <p className="text-sm">{deal?.customer_phone || "Não informado"}</p>
            </div>
            {deal?.description && (
              <div>
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                <p className="text-sm">{deal.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="arquivos" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Anexar Arquivos</CardTitle>
            <CardDescription>XMLs do Promob, plantas, medições</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="xml-upload">XML Promob</Label>
                <Input
                  id="xml-upload"
                  type="file"
                  accept=".xml"
                  disabled={uploadingFile}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFile(file, 'xml');
                  }}
                />
              </div>
              <div>
                <Label htmlFor="planta-upload">Planta (PDF/IMG)</Label>
                <Input
                  id="planta-upload"
                  type="file"
                  accept=".pdf,image/*"
                  disabled={uploadingFile}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFile(file, 'planta');
                  }}
                />
              </div>
              <div>
                <Label htmlFor="medicao-upload">Medição (PDF/IMG)</Label>
                <Input
                  id="medicao-upload"
                  type="file"
                  accept=".pdf,image/*"
                  disabled={uploadingFile}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFile(file, 'medicao');
                  }}
                />
              </div>
            </div>

            {uploadingFile && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}

            <div className="space-y-2">
              {attachments?.map((att) => (
                <div key={att.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {getFileIcon(att.file_type)}
                    <div>
                      <p className="text-sm font-medium">{att.original_filename}</p>
                      <p className="text-xs text-muted-foreground capitalize">{att.file_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" asChild>
                      <a href={att.file_url} target="_blank" rel="noopener noreferrer">Ver</a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteAttachment.mutate(att.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="historico" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Adicionar Interação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <Select value={newInteraction.type} onValueChange={(v) => setNewInteraction({ ...newInteraction, type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ligacao">Ligação</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="reuniao">Reunião</SelectItem>
                  <SelectItem value="anotacao">Anotação</SelectItem>
                </SelectContent>
              </Select>
              <div className="col-span-3">
                <Textarea
                  placeholder="Descrição da interação..."
                  value={newInteraction.content}
                  onChange={(e) => setNewInteraction({ ...newInteraction, content: e.target.value })}
                />
              </div>
            </div>
            <Button
              onClick={() => addInteraction.mutate()}
              disabled={!newInteraction.type || !newInteraction.content || addInteraction.isPending}
            >
              {addInteraction.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {interactions?.map((int: any) => (
                <div key={int.id} className="border-l-2 border-primary pl-4 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium capitalize text-primary">{int.interaction_type}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(int.created_at), "dd/MM/yyyy HH:mm")}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{int.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Por: {int.profiles?.full_name || "Sistema"}
                  </p>
                </div>
              ))}
              {interactions?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma interação registrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="negociacao" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Valores e Datas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Valor Estimado</Label>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(deal?.estimated_value)}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Valor Final</Label>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(deal?.final_value)}
                </p>
              </div>
            </div>
            {deal?.expected_close_date && (
              <div>
                <Label className="text-xs text-muted-foreground">Data Prevista</Label>
                <p className="text-sm">
                  {format(new Date(deal.expected_close_date), "dd/MM/yyyy")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};