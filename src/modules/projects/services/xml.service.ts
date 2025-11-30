// XML Service
// Encapsulates all XML upload and processing operations

import { supabase } from '@/integrations/supabase/client';
import type { PromobFile, ProcessXmlResult } from '../types/projects.types';
import { mapPromobFileRowToPromobFile } from '../adapters/projects.adapters';

export async function uploadXml(
  file: File, 
  projectId: string, 
  customerId: string
): Promise<PromobFile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Perfil não encontrado');

  // Validate file name format: <customerId>_<ambiente>.xml
  const fileName = file.name;
  const match = fileName.match(/^(.+)_(.+)\.xml$/i);
  
  if (!match) {
    throw new Error(`Arquivo ${fileName} deve seguir o padrão: clienteId_ambiente.xml`);
  }

  const [, , ambiente] = match;

  // Upload file to storage
  const filePath = `${profile.company_id}/${projectId}/${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from('project-files')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Register file in database
  const { data, error: fileError } = await supabase
    .from('promob_files')
    .insert({
      company_id: profile.company_id,
      project_id: projectId,
      customer_id: customerId,
      file_path: filePath,
      original_filename: fileName,
      ambiente: ambiente,
      file_type: 'vendido',
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (fileError) throw fileError;
  return mapPromobFileRowToPromobFile(data);
}

export async function processXmlFile(fileId: string): Promise<ProcessXmlResult> {
  const { data, error } = await supabase.functions.invoke('process-xml', {
    body: { promob_file_id: fileId },
  });

  if (error) throw error;

  return {
    success: true,
    items_count: data.items_count || 0,
    message: data.message,
  };
}

export async function listXmlFiles(projectId: string): Promise<PromobFile[]> {
  const { data, error } = await supabase
    .from('promob_files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapPromobFileRowToPromobFile);
}

export async function deleteXmlFile(fileId: string): Promise<void> {
  // Get file info first to delete from storage
  const { data: file, error: fetchError } = await supabase
    .from('promob_files')
    .select('file_path')
    .eq('id', fileId)
    .single();

  if (fetchError) throw fetchError;

  // Delete from storage
  if (file?.file_path) {
    const { error: storageError } = await supabase.storage
      .from('project-files')
      .remove([file.file_path]);

    if (storageError) throw storageError;
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('promob_files')
    .delete()
    .eq('id', fileId);

  if (deleteError) throw deleteError;
}

// Export all functions as a service object for convenience
export const xmlService = {
  uploadXml,
  processXmlFile,
  listXmlFiles,
  deleteXmlFile,
};
