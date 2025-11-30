import { useState } from "react";
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
import { 
  useDeal, 
  useDealInteractions, 
  useDealAttachments, 
  useAddDealInteraction, 
  useUploadDealAttachment, 
  useDeleteDealAttachment 
} from "@/modules/crm";

interface DealDetailsProps {
  dealId: string;
}

export const DealDetails = ({ dealId }: DealDetailsProps) => {
  const [newInteraction, setNewInteraction] = useState({ type: "", content: "" });
  const [uploadingFile, setUploadingFile] = useState(false);

  // Use CRM hooks
  const { data: deal } = useDeal(dealId);
  const { data: attachments } = useDealAttachments(dealId);
  const { data: interactions } = useDealInteractions(dealId);
  const addInteraction = useAddDealInteraction(dealId);
  const uploadAttachment = useUploadDealAttachment(dealId);
  const deleteAttachment = useDeleteDealAttachment(dealId);

  const handleAddInteraction = async () => {
    if (!newInteraction.type || !newInteraction.content) return;
    
    try {
      await addInteraction.mutateAsync({
        interactionType: newInteraction.type,
        content: newInteraction.content,
      });
      toast.success("Interação registrada!");
      setNewInteraction({ type: "", content: "" });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao registrar interação";
      toast.error(errorMessage);
    }
  };

  const uploadFile = async (file: File, fileType: string) => {
    setUploadingFile(true);
    try {
      await uploadAttachment.mutateAsync({ file, fileType });
      toast.success("Arquivo enviado com sucesso!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao enviar arquivo";
      toast.error(errorMessage);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachment.mutateAsync(attachmentId);
      toast.success("Arquivo removido!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao remover arquivo";
      toast.error(errorMessage);
    }
  };

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
              <p className="text-sm font-medium">{deal?.customerName || "Não informado"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Telefone/WhatsApp</Label>
              <p className="text-sm">{deal?.customerPhone || "Não informado"}</p>
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
                    {getFileIcon(att.fileType)}
                    <div>
                      <p className="text-sm font-medium">{att.originalFilename}</p>
                      <p className="text-xs text-muted-foreground capitalize">{att.fileType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" asChild>
                      <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">Ver</a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteAttachment(att.id)}
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
              onClick={handleAddInteraction}
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
              {interactions?.map((interaction) => (
                <div key={interaction.id} className="border-l-2 border-primary pl-4 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium capitalize text-primary">{interaction.interactionType}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(interaction.createdAt), "dd/MM/yyyy HH:mm")}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{interaction.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Por: {interaction.user?.fullName || "Sistema"}
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
                  {formatCurrency(deal?.estimatedValue ?? null)}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Valor Final</Label>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(deal?.finalValue ?? null)}
                </p>
              </div>
            </div>
            {deal?.expectedCloseDate && (
              <div>
                <Label className="text-xs text-muted-foreground">Data Prevista</Label>
                <p className="text-sm">
                  {format(new Date(deal.expectedCloseDate), "dd/MM/yyyy")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};