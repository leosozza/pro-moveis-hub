/**
 * useServiceTickets Hook
 * Custom hook for fetching and managing service tickets.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportService } from '../services/support.service';
import { mapTicketToLegacyCard } from '../adapters/support.adapters';
import type { CreateTicketInput } from '../types/support.types';

/**
 * Fetch service tickets by pipeline ID
 */
export function useServiceTickets(pipelineId: string | undefined) {
  const query = useQuery({
    queryKey: ['service_tickets', pipelineId],
    queryFn: () => supportService.listByPipeline(pipelineId!),
    enabled: !!pipelineId,
  });

  return {
    ...query,
    tickets: query.data || [],
    // Provide legacy format for backward compatibility with KanbanBoard
    ticketsLegacy: (query.data || []).map(mapTicketToLegacyCard),
  };
}

/**
 * Fetch a single service ticket by ID
 */
export function useServiceTicket(ticketId: string | undefined) {
  return useQuery({
    queryKey: ['service_ticket', ticketId],
    queryFn: () => supportService.getById(ticketId!),
    enabled: !!ticketId,
  });
}

/**
 * Create a new service ticket
 */
export function useCreateServiceTicket(pipelineId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTicketInput) => supportService.create(input, pipelineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_tickets'] });
    },
  });
}

/**
 * Move a service ticket to a different stage
 */
export function useMoveTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, newStageId }: { ticketId: string; newStageId: string }) =>
      supportService.moveToStage(ticketId, newStageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_tickets'] });
    },
  });
}
