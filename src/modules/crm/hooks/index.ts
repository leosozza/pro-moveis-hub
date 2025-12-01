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
  useStages,
  useStage,
  useCreateStage,
  useUpdateStage,
  useDeleteStage,
  useReorderStages,
} from './useStages';
export {
  useCustomers,
  useCustomer,
  useCustomersForSelection,
  useCreateCustomer,
} from './useCustomers';
