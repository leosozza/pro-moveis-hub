import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useXmlUpload } from "@/modules/projects/hooks/useXmlUpload";
import { Loader2, Upload } from "lucide-react";

interface XmlUploadProps {
  projectId: string;
  customerId: string;
  onSuccess?: () => void;
}

export const XmlUpload = ({ projectId, customerId, onSuccess }: XmlUploadProps) => {
  const { uploadFile, isUploading } = useXmlUpload();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      for (const file of Array.from(files)) {
        await uploadFile(file, projectId, customerId);
      }
      onSuccess?.();
    } finally {
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
