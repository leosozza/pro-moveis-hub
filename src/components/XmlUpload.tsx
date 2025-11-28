import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload } from "lucide-react";

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("Perfil não encontrado");

      for (const file of Array.from(files)) {
        // Validar nome do arquivo: <customerId>_<ambiente>.xml
        const fileName = file.name;
        const match = fileName.match(/^(.+)_(.+)\.xml$/i);
        
        if (!match) {
          toast({
            title: "Nome inválido",
            description: `Arquivo ${fileName} deve seguir o padrão: clienteId_ambiente.xml`,
            variant: "destructive",
          });
          continue;
        }

        const [, fileCustomerId, ambiente] = match;

        // Fazer upload do arquivo
        const filePath = `${profile.company_id}/${projectId}/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("project-files")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Registrar arquivo no banco
        const { data: promobFile, error: fileError } = await supabase
          .from("promob_files")
          .insert({
            company_id: profile.company_id,
            project_id: projectId,
            customer_id: customerId,
            file_path: filePath,
            original_filename: fileName,
            ambiente: ambiente,
            file_type: "vendido",
            uploaded_by: user.id,
          })
          .select()
          .single();

        if (fileError) throw fileError;

        // Processar XML via Edge Function
        const { data, error: processError } = await supabase.functions.invoke("process-xml", {
          body: { promob_file_id: promobFile.id },
        });

        if (processError) throw processError;

        toast({
          title: "XML processado",
          description: `${fileName} importado com sucesso! ${data.items_count} itens adicionados.`,
        });
      }

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
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
