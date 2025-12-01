/**
 * CRM Service
 * Orchestration service that combines all CRM-related services.
 * Use this as the main entry point for CRM operations.
 */

export { companyService } from './company.service';
export { usersService } from './users.service';
export { pipelinesService } from './pipelines.service';
export { dealsService } from './deals.service';
export { stagesService } from './stages.service';
export { customersService } from './customers.service';

// Re-export types for convenience
export type {
  Pipeline,
  Stage,
  Deal,
  Customer,
  DealInteraction,
  DealAttachment,
  KanbanCard,
  CreateDealInput,
  MoveDealInput,
  CreateCustomerInput,
} from '../types/crm.types';

// Re-export adapters
export {
  mapDealRowToDeal,
  mapPipelineRowToPipeline,
  mapStageRowToStage,
  mapCustomerRowToCustomer,
  mapDealToKanbanCard,
  mapDealToLegacyCard,
  mapStageToLegacy,
} from '../adapters/crm.adapters';
