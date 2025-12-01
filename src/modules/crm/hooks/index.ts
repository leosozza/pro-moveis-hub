// Types
export type { 
  Deal, 
  Stage, 
  Pipeline, 
  PipelineType, 
  Customer, 
  CreateDealInput 
} from './types';

// Hooks
export { useDeals } from './useDeals';
export type { UseDealsReturn } from './useDeals';

export { usePipelines } from './usePipelines';
export type { UsePipelinesReturn } from './usePipelines';

export { useMoveDeal } from './useMoveDeal';
export type { UseMoveDealReturn } from './useMoveDeal';

export { useStages } from './useStages';
export type { UseStagesReturn } from './useStages';

export { useCreateDeal } from './useCreateDeal';
export type { CreateDealData, UseCreateDealReturn } from './useCreateDeal';

export { useCustomers } from './useCustomers';
export type { UseCustomersReturn } from './useCustomers';
/**
 * CRM Hooks Module Index
 * Re-exports all CRM-related hooks.
 */

export { usePipeline, usePipelines, usePipelineById } from './usePipelines';
export {
  useDeals,
  useDeal,
  useCreateDeal,
  useMoveDeal,
  useDealInteractions,
  useAddDealInteraction,
  useDealAttachments,
  useUploadDealAttachment,
  useDeleteDealAttachment,
} from './useDeals';
export {
  useCustomers,
  useCustomer,
  useCustomersForSelection,
  useCreateCustomer,
} from './useCustomers';
