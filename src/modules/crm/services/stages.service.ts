// Stages Service
// Encapsulates all stage-related Supabase operations

import { supabase } from '@/integrations/supabase/client';
import type { Stage, CreateStageInput, UpdateStageInput } from '../types/crm.types';
import { mapStageRowToStage } from '../adapters/crm.adapters';

export async function listStages(pipelineId: string): Promise<Stage[]> {
  const { data, error } = await supabase
    .from('stages')
    .select('*')
    .eq('pipeline_id', pipelineId)
    .order('position');

  if (error) throw error;
  return (data || []).map(mapStageRowToStage);
}

export async function getStageById(stageId: string): Promise<Stage> {
  const { data, error } = await supabase
    .from('stages')
    .select('*')
    .eq('id', stageId)
    .single();

  if (error) throw error;
  return mapStageRowToStage(data);
}

export async function createStage(input: CreateStageInput): Promise<Stage> {
  const { data, error } = await supabase
    .from('stages')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return mapStageRowToStage(data);
}

export async function updateStage(stageId: string, input: UpdateStageInput): Promise<Stage> {
  const { data, error } = await supabase
    .from('stages')
    .update(input)
    .eq('id', stageId)
    .select()
    .single();

  if (error) throw error;
  return mapStageRowToStage(data);
}

export async function deleteStage(stageId: string): Promise<void> {
  const { error } = await supabase
    .from('stages')
    .delete()
    .eq('id', stageId);

  if (error) throw error;
}

// Export all functions as a service object for convenience
export const stagesService = {
  listStages,
  getStageById,
  createStage,
  updateStage,
  deleteStage,
};
