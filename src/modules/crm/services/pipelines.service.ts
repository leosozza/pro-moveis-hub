/**
 * Pipelines Service
 * Encapsulates all Supabase operations for pipelines.
 */

import { supabase } from '@/integrations/supabase/client';
import { mapPipelineRowToPipeline } from '../adapters/crm.adapters';
import type { Pipeline } from '../types/crm.types';

export const pipelinesService = {
  /**
   * Fetch a pipeline by type (vendas, pos_venda, assistencia)
   */
  async getByType(type: Pipeline['type']): Promise<Pipeline | null> {
    const { data, error } = await supabase
      .from('pipelines')
      .select('*, stages(*)')
      .eq('type', type)
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) throw error;

    const pipelineData = data?.[0] || null;
    if (!pipelineData) return null;

    return mapPipelineRowToPipeline(pipelineData);
  },

  /**
   * Fetch all pipelines for the current company
   */
  async getAll(): Promise<Pipeline[]> {
    const { data, error } = await supabase
      .from('pipelines')
      .select('*, stages(*)')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(mapPipelineRowToPipeline);
  },

  /**
   * Get a specific pipeline by ID
   */
  async getById(pipelineId: string): Promise<Pipeline | null> {
    const { data, error } = await supabase
      .from('pipelines')
      .select('*, stages(*)')
      .eq('id', pipelineId)
      .single();

    if (error) throw error;

    return data ? mapPipelineRowToPipeline(data) : null;
  },
};
