/**
 * useXmlUpload Hook
 * Custom hook for XML file upload and processing.
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { xmlService } from '../services/xml.service';
import type { XmlUploadResult } from '../types/projects.types';

interface UploadProgress {
  fileName: string;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  result?: XmlUploadResult & { ambiente: string };
}

/**
 * Hook for uploading and processing XML files
 */
export function useXmlUpload(projectId: string, customerId: string) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<UploadProgress[]>([]);

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const results: UploadProgress[] = [];

      for (const file of files) {
        const progressItem: UploadProgress = {
          fileName: file.name,
          status: 'uploading',
        };
        setProgress(prev => [...prev.filter(p => p.fileName !== file.name), progressItem]);

        try {
          // Validate file name
          const validation = xmlService.validateFileName(file.name);
          if (!validation.isValid) {
            results.push({
              fileName: file.name,
              status: 'error',
              error: `Nome inválido. Use o formato: clienteId_ambiente.xml`,
            });
            setProgress(prev => prev.map(p => 
              p.fileName === file.name 
                ? { ...p, status: 'error', error: `Nome inválido. Use o formato: clienteId_ambiente.xml` } 
                : p
            ));
            continue;
          }

          // Update progress to processing
          setProgress(prev => prev.map(p => 
            p.fileName === file.name ? { ...p, status: 'processing' } : p
          ));

          // Upload and process
          const result = await xmlService.uploadAndProcessXml(file, projectId, customerId);

          results.push({
            fileName: file.name,
            status: 'success',
            result,
          });
          setProgress(prev => prev.map(p => 
            p.fileName === file.name ? { ...p, status: 'success', result } : p
          ));
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          results.push({
            fileName: file.name,
            status: 'error',
            error: errorMessage,
          });
          setProgress(prev => prev.map(p => 
            p.fileName === file.name ? { ...p, status: 'error', error: errorMessage } : p
          ));
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const clearProgress = () => {
    setProgress([]);
  };

  return {
    uploadFiles: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    progress,
    clearProgress,
    successCount: progress.filter(p => p.status === 'success').length,
    errorCount: progress.filter(p => p.status === 'error').length,
  };
}

/**
 * Simpler hook for single file upload
 */
export function useXmlUploadSingle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, projectId, customerId }: { file: File; projectId: string; customerId: string }) =>
      xmlService.uploadAndProcessXml(file, projectId, customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}
