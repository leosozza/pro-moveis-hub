-- 1. Adicionar logo_url à tabela companies
ALTER TABLE public.companies ADD COLUMN logo_url TEXT;

-- 2. Adicionar campos de controle nas etapas
ALTER TABLE public.stages 
  ADD COLUMN is_win_stage BOOLEAN DEFAULT FALSE,
  ADD COLUMN is_loss_stage BOOLEAN DEFAULT FALSE;

-- 3. Criar tabela de túneis entre pipelines
CREATE TABLE public.pipeline_tunnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  source_stage_id UUID NOT NULL REFERENCES public.stages(id),
  target_pipeline_id UUID NOT NULL REFERENCES public.pipelines(id),
  target_stage_id UUID REFERENCES public.stages(id),
  action_type TEXT NOT NULL DEFAULT 'copy',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pipeline_tunnels ENABLE ROW LEVEL SECURITY;

-- RLS Policies para pipeline_tunnels
CREATE POLICY "Admins podem gerenciar túneis"
ON public.pipeline_tunnels
FOR ALL
USING (
  company_id = public.get_user_company_id(auth.uid()) 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Usuários podem ver túneis da empresa"
ON public.pipeline_tunnels
FOR SELECT
USING (company_id = public.get_user_company_id(auth.uid()));

-- 4. Criar tabela de anexos do deal
CREATE TABLE public.deal_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  original_filename TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deal_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies para deal_attachments
CREATE POLICY "Usuários podem criar anexos"
ON public.deal_attachments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id = deal_attachments.deal_id
    AND deals.company_id = public.get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Usuários podem ver anexos da empresa"
ON public.deal_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id = deal_attachments.deal_id
    AND deals.company_id = public.get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Usuários podem deletar anexos"
ON public.deal_attachments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id = deal_attachments.deal_id
    AND deals.company_id = public.get_user_company_id(auth.uid())
  )
);

-- 5. Criar tabela de histórico de interações
CREATE TABLE public.deal_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  interaction_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deal_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies para deal_interactions
CREATE POLICY "Usuários podem criar interações"
ON public.deal_interactions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id = deal_interactions.deal_id
    AND deals.company_id = public.get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Usuários podem ver interações da empresa"
ON public.deal_interactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id = deal_interactions.deal_id
    AND deals.company_id = public.get_user_company_id(auth.uid())
  )
);

-- 6. Tornar customer_id opcional no deals
ALTER TABLE public.deals ALTER COLUMN customer_id DROP NOT NULL;

-- Adicionar campos para dados do cliente inline no deal
ALTER TABLE public.deals 
  ADD COLUMN customer_name TEXT,
  ADD COLUMN customer_phone TEXT;

-- Trigger para atualizar updated_at em pipeline_tunnels
CREATE TRIGGER update_pipeline_tunnels_updated_at
BEFORE UPDATE ON public.pipeline_tunnels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar updated_at a pipeline_tunnels
ALTER TABLE public.pipeline_tunnels ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Permitir que admins gerenciem stages
CREATE POLICY "Admins podem gerenciar stages"
ON public.stages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.pipelines
    WHERE pipelines.id = stages.pipeline_id
    AND pipelines.company_id = public.get_user_company_id(auth.uid())
  )
  AND public.has_role(auth.uid(), 'admin')
);