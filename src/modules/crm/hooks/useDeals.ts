import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Deal } from "./types";

export interface UseDealsReturn {
  deals: Deal[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useDeals = (pipelineId?: string): UseDealsReturn => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['deals', pipelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("pipeline_id", pipelineId!)
        .order("position");
      
      if (error) throw error;
      
      return data?.map(d => ({
        ...d,
        customers: d.customer_name ? { name: d.customer_name } : null,
      })) as Deal[];
    },
/**
 * useDeals Hook
 * Custom hook for fetching and managing deals.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealsService } from '../services/deals.service';
import { mapDealToLegacyCard } from '../adapters/crm.adapters';
import type { CreateDealInput } from '../types/crm.types';

/**
 * Fetch deals by pipeline ID
 */
export function useDeals(pipelineId: string | undefined) {
  const query = useQuery({
    queryKey: ['deals', pipelineId],
    queryFn: () => dealsService.listByPipeline(pipelineId!),
    enabled: !!pipelineId,
  });

  return {
    deals: data || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
    ...query,
    deals: query.data || [],
    // Provide legacy format for backward compatibility with KanbanBoard
    dealsLegacy: (query.data || []).map(mapDealToLegacyCard),
  };
}

/**
 * Fetch a single deal by ID
 */
export function useDeal(dealId: string | undefined) {
  return useQuery({
    queryKey: ['deal', dealId],
    queryFn: () => dealsService.getById(dealId!),
    enabled: !!dealId,
  });
}

/**
 * Create a new deal
 */
export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDealInput) => dealsService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

/**
 * Move a deal to a different stage
 */
export function useMoveDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, newStageId }: { dealId: string; newStageId: string }) =>
      dealsService.moveToStage(dealId, newStageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

/**
 * Fetch deal interactions
 */
export function useDealInteractions(dealId: string | undefined) {
  return useQuery({
    queryKey: ['deal_interactions', dealId],
    queryFn: () => dealsService.getInteractions(dealId!),
    enabled: !!dealId,
  });
}

/**
 * Add an interaction to a deal
 */
export function useAddDealInteraction(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ interactionType, content }: { interactionType: string; content: string }) =>
      dealsService.addInteraction(dealId, interactionType, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal_interactions', dealId] });
    },
  });
}

/**
 * Fetch deal attachments
 */
export function useDealAttachments(dealId: string | undefined) {
  return useQuery({
    queryKey: ['deal_attachments', dealId],
    queryFn: () => dealsService.getAttachments(dealId!),
    enabled: !!dealId,
  });
}

/**
 * Upload an attachment to a deal
 */
export function useUploadDealAttachment(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, fileType }: { file: File; fileType: string }) =>
      dealsService.uploadAttachment(dealId, file, fileType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal_attachments', dealId] });
    },
  });
}

/**
 * Delete a deal attachment
 */
export function useDeleteDealAttachment(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) => dealsService.deleteAttachment(attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal_attachments', dealId] });
    },
  });
}
