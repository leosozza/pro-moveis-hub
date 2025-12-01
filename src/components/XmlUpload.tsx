import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { xmlService } from "@/modules/projects/services/xml.service";

interface XmlUploadProps {
  projectId: string;
  customerId: string;
  onSuccess?: () => void;
}

export const XmlUpload = ({ projectId, customerId, onSuccess }: XmlUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Validate file name format
        const validation = xmlService.validateFileName(file.name);
        
        if (!validation.isValid) {
          toast({
            title: "Nome inválido",
            description: `Arquivo ${file.name} deve seguir o padrão: clienteId_ambiente.xml`,
            variant: "destructive",
          });
          continue;
        }

        try {
          // Upload and process XML using the xml service
          const result = await xmlService.uploadAndProcessXml(file, projectId, customerId);

          toast({
            title: "XML processado",
            description: `${file.name} importado com sucesso! ${result.itemsCount} itens adicionados.`,
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Erro ao processar arquivo";
          toast({
            title: "Erro no upload",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }

      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao fazer upload";
      toast({
        title: "Erro no upload",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="xml-upload">Upload de XMLs do Promob</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Formato: clienteId_ambiente.xml (ex: 123_cozinha.xml)
        </p>
        <div className="flex gap-2">
          <Input
            id="xml-upload"
            type="file"
            accept=".xml"
            multiple
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <Button disabled={isUploading} variant="secondary">
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
