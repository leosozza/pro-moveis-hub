// useXmlUpload Hook
// React hook for uploading and processing XML files

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadXml, processXmlFile } from '../services/xml.service';
import { toast } from 'sonner';

interface UploadProgress {
  fileName: string;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
}

export const useXmlUpload = () => {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ file, projectId, customerId }: { 
      file: File; 
      projectId: string; 
      customerId: string;
    }) => {
      setProgress({ fileName: file.name, status: 'uploading', progress: 30 });
      
      // Upload file
      const promobFile = await uploadXml(file, projectId, customerId);
      
      setProgress({ fileName: file.name, status: 'processing', progress: 60 });
      
      // Process XML
      const result = await processXmlFile(promobFile.id);
      
      setProgress({ fileName: file.name, status: 'complete', progress: 100 });
      
      return { file: promobFile, result };
    },
    onSuccess: ({ file, result }) => {
      queryClient.invalidateQueries({ queryKey: ['promob_files'] });
      queryClient.invalidateQueries({ queryKey: ['budget_items'] });
      toast.success(`${file.original_filename} importado com sucesso! ${result.items_count} itens adicionados.`);
      
      // Reset progress after a delay
      setTimeout(() => setProgress(null), 1000);
    },
    onError: (error: Error) => {
      setProgress(null);
      toast.error(error.message || 'Erro no upload');
    },
  });

  const uploadFile = async (file: File, projectId: string, customerId: string) => {
    return mutation.mutateAsync({ file, projectId, customerId });
  };

  return {
    uploadFile,
    isUploading: mutation.isPending,
    error: mutation.error,
    progress,
  };
};
