/**
 * Deals Service
 * Encapsulates all Supabase operations for deals.
 */

import { supabase } from '@/integrations/supabase/client';
import { mapDealRowToDeal, mapDealInteractionRowToInteraction, mapDealAttachmentRowToAttachment } from '../adapters/crm.adapters';
import type { Deal, DealInteraction, DealAttachment, CreateDealInput } from '../types/crm.types';

export const dealsService = {
  /**
   * List deals by pipeline ID
   */
  async listByPipeline(pipelineId: string): Promise<Deal[]> {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        customers:customer_id(name),
        projects:project_id(name),
        profiles:responsible_id(full_name)
      `)
      .eq('pipeline_id', pipelineId)
      .order('position');

    if (error) throw error;

    return (data || []).map(mapDealRowToDeal);
  },

  /**
   * Get a single deal by ID
   */
  async getById(dealId: string): Promise<Deal | null> {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (error) throw error;

    return data ? mapDealRowToDeal(data) : null;
  },

  /**
   * Create a new deal
   */
  async create(input: CreateDealInput): Promise<Deal> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userData.user.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('deals')
      .insert({
        title: input.title,
        customer_name: input.customerName,
        customer_phone: input.customerPhone,
        description: input.description,
        company_id: profile.company_id,
        pipeline_id: input.pipelineId,
        stage_id: input.stageId,
        responsible_id: userData.user.id,
        position: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return mapDealRowToDeal(data);
  },

  /**
   * Move a deal to a different stage
   */
  async moveToStage(dealId: string, newStageId: string): Promise<void> {
    const { error } = await supabase
      .from('deals')
      .update({ stage_id: newStageId })
      .eq('id', dealId);

    if (error) throw error;
  },

  /**
   * Update deal position
   */
  async updatePosition(dealId: string, position: number): Promise<void> {
    const { error } = await supabase
      .from('deals')
      .update({ position })
      .eq('id', dealId);

    if (error) throw error;
  },

  /**
   * Get deal interactions
   */
  async getInteractions(dealId: string): Promise<DealInteraction[]> {
    const { data, error } = await supabase
      .from('deal_interactions')
      .select(`
        *,
        profiles:user_id(full_name)
      `)
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDealInteractionRowToInteraction);
  },

  /**
   * Add an interaction to a deal
   */
  async addInteraction(
    dealId: string,
    interactionType: string,
    content: string
  ): Promise<DealInteraction> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Não autenticado');

    const { data, error } = await supabase
      .from('deal_interactions')
      .insert({
        deal_id: dealId,
        user_id: userData.user.id,
        interaction_type: interactionType,
        content,
      })
      .select(`
        *,
        profiles:user_id(full_name)
      `)
      .single();

    if (error) throw error;

    return mapDealInteractionRowToInteraction(data);
  },

  /**
   * Get deal attachments
   */
  async getAttachments(dealId: string): Promise<DealAttachment[]> {
    const { data, error } = await supabase
      .from('deal_attachments')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDealAttachmentRowToAttachment);
  },

  /**
   * Upload and attach a file to a deal
   */
  async uploadAttachment(
    dealId: string,
    file: File,
    fileType: string
  ): Promise<DealAttachment> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Não autenticado');

    const fileExt = file.name.split('.').pop();
    const fileName = `${dealId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('project-files')
      .getPublicUrl(fileName);

    const { data, error: insertError } = await supabase
      .from('deal_attachments')
      .insert({
        deal_id: dealId,
        file_type: fileType,
        file_url: publicUrl,
        original_filename: file.name,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return mapDealAttachmentRowToAttachment(data);
  },

  /**
   * Delete an attachment
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    const { error } = await supabase
      .from('deal_attachments')
      .delete()
      .eq('id', attachmentId);

    if (error) throw error;
  },
};
