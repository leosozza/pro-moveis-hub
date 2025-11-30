-- Fix duplicate pipelines by keeping only the oldest one for each company/type combination
-- This migration:
-- 1. Moves all deals/service_tickets from duplicate pipelines to the main pipeline
-- 2. Updates stages to point to the main pipeline (or removes duplicates)
-- 3. Deletes duplicate pipelines

-- Create a function to clean duplicate pipelines
DO $$
DECLARE
  rec RECORD;
  main_pipeline_id UUID;
  dup_pipeline_id UUID;
  main_stage_id UUID;
  dup_stage_id UUID;
  stage_rec RECORD;
BEGIN
  -- For each company_id and type combination that has duplicates
  FOR rec IN 
    SELECT company_id, type, array_agg(id ORDER BY created_at) as pipeline_ids
    FROM public.pipelines
    GROUP BY company_id, type
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the first (oldest) pipeline as the main one
    main_pipeline_id := rec.pipeline_ids[1];
    
    -- Process each duplicate pipeline
    FOR i IN 2..array_length(rec.pipeline_ids, 1) LOOP
      dup_pipeline_id := rec.pipeline_ids[i];
      
      -- For each stage in the duplicate pipeline, move items to corresponding stage in main pipeline
      FOR stage_rec IN
        SELECT ds.id as dup_stage_id, ds.name, ds.position,
               ms.id as main_stage_id
        FROM public.stages ds
        LEFT JOIN public.stages ms ON ms.pipeline_id = main_pipeline_id 
          AND ms.position = ds.position
        WHERE ds.pipeline_id = dup_pipeline_id
      LOOP
        -- If main stage exists with same position, move items there
        IF stage_rec.main_stage_id IS NOT NULL THEN
          -- Move deals from duplicate stage to main stage
          UPDATE public.deals 
          SET stage_id = stage_rec.main_stage_id,
              pipeline_id = main_pipeline_id
          WHERE stage_id = stage_rec.dup_stage_id;
          
          -- Move service_tickets from duplicate stage to main stage
          UPDATE public.service_tickets 
          SET stage_id = stage_rec.main_stage_id,
              pipeline_id = main_pipeline_id
          WHERE stage_id = stage_rec.dup_stage_id;
          
          -- Delete pipeline tunnels referencing duplicate stage
          DELETE FROM public.pipeline_tunnels
          WHERE source_stage_id = stage_rec.dup_stage_id
             OR target_stage_id = stage_rec.dup_stage_id;
        ELSE
          -- If no corresponding stage exists, get first stage of main pipeline
          SELECT id INTO main_stage_id
          FROM public.stages
          WHERE pipeline_id = main_pipeline_id
          ORDER BY position
          LIMIT 1;
          
          -- Move items to first stage
          UPDATE public.deals 
          SET stage_id = main_stage_id,
              pipeline_id = main_pipeline_id
          WHERE stage_id = stage_rec.dup_stage_id;
          
          UPDATE public.service_tickets 
          SET stage_id = main_stage_id,
              pipeline_id = main_pipeline_id
          WHERE stage_id = stage_rec.dup_stage_id;
          
          -- Delete pipeline tunnels referencing duplicate stage
          DELETE FROM public.pipeline_tunnels
          WHERE source_stage_id = stage_rec.dup_stage_id
             OR target_stage_id = stage_rec.dup_stage_id;
        END IF;
      END LOOP;
      
      -- Delete duplicate stages (CASCADE will handle them)
      -- Note: stages have CASCADE DELETE from pipelines
      
      -- Delete pipeline tunnels referencing duplicate pipeline
      DELETE FROM public.pipeline_tunnels
      WHERE target_pipeline_id = dup_pipeline_id;
      
      -- Delete the duplicate pipeline (stages will be deleted by CASCADE)
      DELETE FROM public.pipelines WHERE id = dup_pipeline_id;
    END LOOP;
  END LOOP;
END $$;

-- Add a unique constraint to prevent future duplicates
-- First check if constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pipelines_company_type_unique'
  ) THEN
    ALTER TABLE public.pipelines 
    ADD CONSTRAINT pipelines_company_type_unique 
    UNIQUE (company_id, type);
  END IF;
END $$;
