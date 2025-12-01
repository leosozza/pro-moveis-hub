/**
 * useStages Hook
 * Custom hook for fetching and managing pipeline stages.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stagesService, type CreateStageInput, type UpdateStageInput } from '../services/stages.service';

/**
 * Fetch stages for a pipeline
 */
export function useStages(pipelineId: string | undefined) {
  return useQuery({
    queryKey: ['stages', pipelineId],
    queryFn: () => stagesService.listByPipeline(pipelineId!),
    enabled: !!pipelineId,
  });
}

/**
 * Fetch a single stage by ID
 */
export function useStage(stageId: string | undefined) {
  return useQuery({
    queryKey: ['stage', stageId],
    queryFn: () => stagesService.getById(stageId!),
    enabled: !!stageId,
  });
}

/**
 * Create a new stage
 */
export function useCreateStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateStageInput) => stagesService.create(input),
    onSuccess: (newStage) => {
      // Invalidate the stages list for this pipeline
      queryClient.invalidateQueries({ queryKey: ['stages', newStage.pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline', newStage.pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}

/**
 * Update a stage
 */
export function useUpdateStage(stageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateStageInput) => stagesService.update(stageId, input),
    onSuccess: (updatedStage) => {
      queryClient.invalidateQueries({ queryKey: ['stage', stageId] });
      queryClient.invalidateQueries({ queryKey: ['stages', updatedStage.pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline', updatedStage.pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}

/**
 * Delete a stage
 */
export function useDeleteStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stageId: string) => stagesService.delete(stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages'] });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}

/**
 * Reorder stages
 */
export function useReorderStages(pipelineId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stages: { id: string; position: number }[]) => 
      stagesService.reorder(stages),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages', pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}
