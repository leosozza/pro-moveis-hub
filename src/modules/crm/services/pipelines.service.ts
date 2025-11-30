// Pipelines Service
// Encapsulates all pipeline-related Supabase operations

import { supabase } from '@/integrations/supabase/client';
import type { Pipeline, PipelineType, CreatePipelineInput, UpdatePipelineInput } from '../types/crm.types';
import { mapPipelineRowToPipeline } from '../adapters/crm.adapters';

export async function listPipelines(type?: PipelineType): Promise<Pipeline[]> {
  let query = supabase
    .from('pipelines')
    .select('*, stages(*)')
    .order('created_at', { ascending: true });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Sort stages by position for each pipeline
  return (data || []).map(pipeline => {
    const mapped = mapPipelineRowToPipeline(pipeline);
    if (mapped.stages) {
      mapped.stages = mapped.stages.sort((a, b) => a.position - b.position);
    }
    return mapped;
  });
}

export async function getPipelineById(pipelineId: string): Promise<Pipeline> {
  const { data, error } = await supabase
    .from('pipelines')
    .select('*, stages(*)')
    .eq('id', pipelineId)
    .single();

  if (error) throw error;

  const mapped = mapPipelineRowToPipeline(data);
  if (mapped.stages) {
    mapped.stages = mapped.stages.sort((a, b) => a.position - b.position);
  }
  return mapped;
}

export async function getPipelineByType(type: PipelineType): Promise<Pipeline | null> {
  const { data, error } = await supabase
    .from('pipelines')
    .select('*, stages(*)')
    .eq('type', type)
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const mapped = mapPipelineRowToPipeline(data[0]);
  if (mapped.stages) {
    mapped.stages = mapped.stages.sort((a, b) => a.position - b.position);
  }
  return mapped;
}

export async function createPipeline(input: CreatePipelineInput): Promise<Pipeline> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Perfil não encontrado');

  const { data, error } = await supabase
    .from('pipelines')
    .insert({
      ...input,
      company_id: profile.company_id,
    })
    .select('*, stages(*)')
    .single();

  if (error) throw error;
  return mapPipelineRowToPipeline(data);
}

export async function updatePipeline(pipelineId: string, input: UpdatePipelineInput): Promise<Pipeline> {
  const { data, error } = await supabase
    .from('pipelines')
    .update(input)
    .eq('id', pipelineId)
    .select('*, stages(*)')
    .single();

  if (error) throw error;

  const mapped = mapPipelineRowToPipeline(data);
  if (mapped.stages) {
    mapped.stages = mapped.stages.sort((a, b) => a.position - b.position);
  }
  return mapped;
}

// Export all functions as a service object for convenience
export const pipelinesService = {
  listPipelines,
  getPipelineById,
  getPipelineByType,
  createPipeline,
  updatePipeline,
};
