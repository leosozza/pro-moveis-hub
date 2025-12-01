/**
 * Stages Service
 * Encapsulates all Supabase operations for pipeline stages.
 */

import { supabase } from '@/integrations/supabase/client';
import { mapStageRowToStage, mapStagesToSorted } from '../adapters/crm.adapters';
import type { Stage } from '../types/crm.types';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export interface CreateStageInput {
  pipelineId: string;
  name: string;
  position: number;
  color?: string;
  isWinStage?: boolean;
  isLossStage?: boolean;
}

export interface UpdateStageInput {
  name?: string;
  position?: number;
  color?: string;
  isWinStage?: boolean;
  isLossStage?: boolean;
}

export const stagesService = {
  /**
   * List all stages for a pipeline
   */
  async listByPipeline(pipelineId: string): Promise<Stage[]> {
    const { data, error } = await supabase
      .from('stages')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('position');

    if (error) throw error;

    return mapStagesToSorted(data || []);
  },

  /**
   * Get a single stage by ID
   */
  async getById(stageId: string): Promise<Stage | null> {
    const { data, error } = await supabase
      .from('stages')
      .select('*')
      .eq('id', stageId)
      .single();

    if (error) throw error;

    return data ? mapStageRowToStage(data) : null;
  },

  /**
   * Create a new stage
   */
  async create(input: CreateStageInput): Promise<Stage> {
    const insertData: TablesInsert<'stages'> = {
      pipeline_id: input.pipelineId,
      name: input.name,
      position: input.position,
      color: input.color,
      is_win_stage: input.isWinStage,
      is_loss_stage: input.isLossStage,
    };

    const { data, error } = await supabase
      .from('stages')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return mapStageRowToStage(data);
  },

  /**
   * Update a stage
   */
  async update(stageId: string, input: UpdateStageInput): Promise<Stage> {
    const updateData: TablesUpdate<'stages'> = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.position !== undefined) updateData.position = input.position;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.isWinStage !== undefined) updateData.is_win_stage = input.isWinStage;
    if (input.isLossStage !== undefined) updateData.is_loss_stage = input.isLossStage;

    const { data, error } = await supabase
      .from('stages')
      .update(updateData)
      .eq('id', stageId)
      .select()
      .single();

    if (error) throw error;

    return mapStageRowToStage(data);
  },

  /**
   * Delete a stage
   */
  async delete(stageId: string): Promise<void> {
    const { error } = await supabase
      .from('stages')
      .delete()
      .eq('id', stageId);

    if (error) throw error;
  },

  /**
   * Reorder stages (update multiple positions)
   */
  async reorder(stages: { id: string; position: number }[]): Promise<void> {
    // Update each stage position
    const updates = stages.map(({ id, position }) =>
      supabase
        .from('stages')
        .update({ position })
        .eq('id', id)
    );

    const results = await Promise.all(updates);
    
    // Check for errors
    const errorResult = results.find((result) => result.error);
    if (errorResult?.error) {
      throw errorResult.error;
    }
  },
};
