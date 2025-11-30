/**
 * XML Service
 * Encapsulates all XML upload and processing operations.
 */

import { supabase } from '@/integrations/supabase/client';
import type { XmlUploadResult } from '../types/projects.types';

export interface XmlFileUploadInput {
  file: File;
  projectId: string;
  customerId: string;
  ambiente: string;
}

export const xmlService = {
  /**
   * Validate XML file name format (expected: customerId_ambiente.xml)
   */
  validateFileName(fileName: string): { isValid: boolean; customerId?: string; ambiente?: string } {
    const match = fileName.match(/^(.+)_(.+)\.xml$/i);
    if (!match) {
      return { isValid: false };
    }
    const [, customerId, ambiente] = match;
    return { isValid: true, customerId, ambiente };
  },

  /**
   * Upload an XML file and register it in the database
   */
  async uploadXml(
    file: File,
    projectId: string,
    customerId: string
  ): Promise<{ promobFileId: string; ambiente: string }> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userData.user.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    // Validate file name format
    const validation = this.validateFileName(file.name);
    if (!validation.isValid) {
      throw new Error(`Nome de arquivo inválido: ${file.name}. Use o formato: clienteId_ambiente.xml`);
    }

    const ambiente = validation.ambiente!;

    // Upload file to storage
    const filePath = `${profile.company_id}/${projectId}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Register file in database
    const { data: promobFile, error: fileError } = await supabase
      .from('promob_files')
      .insert({
        company_id: profile.company_id,
        project_id: projectId,
        customer_id: customerId,
        file_path: filePath,
        original_filename: file.name,
        ambiente,
        file_type: 'vendido',
        uploaded_by: userData.user.id,
      })
      .select()
      .single();

    if (fileError) throw fileError;

    return { promobFileId: promobFile.id, ambiente };
  },

  /**
   * Process an uploaded XML file via Edge Function
   */
  async processXml(promobFileId: string): Promise<XmlUploadResult> {
    const { data, error } = await supabase.functions.invoke('process-xml', {
      body: { promob_file_id: promobFileId },
    });

    if (error) throw error;

    return {
      promobFileId,
      itemsCount: data?.items_count || 0,
    };
  },

  /**
   * Upload and process an XML file in one operation
   */
  async uploadAndProcessXml(
    file: File,
    projectId: string,
    customerId: string
  ): Promise<XmlUploadResult & { ambiente: string }> {
    const { promobFileId, ambiente } = await this.uploadXml(file, projectId, customerId);
    const result = await this.processXml(promobFileId);
    return { ...result, ambiente };
  },
};
