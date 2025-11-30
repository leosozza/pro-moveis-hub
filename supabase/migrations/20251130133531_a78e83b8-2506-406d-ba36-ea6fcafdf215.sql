-- Corrigir dados do usuário existente e atualizar triggers

-- 1. Criar empresa para usuário existente (se ainda não tiver)
DO $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_vendas_pipeline_id UUID;
  v_pos_venda_pipeline_id UUID;
  v_assistencia_pipeline_id UUID;
BEGIN
  -- Pegar o primeiro usuário que não tem profile
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE id NOT IN (SELECT id FROM public.profiles)
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Criar empresa
    INSERT INTO public.companies (name)
    VALUES ('Minha Marcenaria')
    RETURNING id INTO v_company_id;

    -- Criar profile
    INSERT INTO public.profiles (id, company_id, full_name)
    VALUES (
      v_user_id,
      v_company_id,
      COALESCE((SELECT email FROM auth.users WHERE id = v_user_id), 'Usuário')
    );

    -- Dar role de admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT DO NOTHING;

    -- Criar pipeline de vendas
    INSERT INTO public.pipelines (company_id, name, type)
    VALUES (v_company_id, 'Vendas', 'vendas')
    RETURNING id INTO v_vendas_pipeline_id;

    -- Criar estágios de vendas com win/loss corretos
    INSERT INTO public.stages (pipeline_id, name, position, color, is_win_stage, is_loss_stage) VALUES
      (v_vendas_pipeline_id, 'Lead novo', 1, '#3b82f6', false, false),
      (v_vendas_pipeline_id, 'Triagem', 2, '#8b5cf6', false, false),
      (v_vendas_pipeline_id, 'Elaboração de projeto', 3, '#f59e0b', false, false),
      (v_vendas_pipeline_id, 'Apresentação ao cliente', 4, '#10b981', false, false),
      (v_vendas_pipeline_id, 'Negociação', 5, '#06b6d4', false, false),
      (v_vendas_pipeline_id, 'Fechado (ganho)', 6, '#22c55e', true, false),
      (v_vendas_pipeline_id, 'Perda', 7, '#ef4444', false, true);

    -- Criar pipeline de pós-venda
    INSERT INTO public.pipelines (company_id, name, type)
    VALUES (v_company_id, 'Pós-Venda', 'pos_venda')
    RETURNING id INTO v_pos_venda_pipeline_id;

    -- Criar estágios de pós-venda
    INSERT INTO public.stages (pipeline_id, name, position, color) VALUES
      (v_pos_venda_pipeline_id, 'Medição in loco', 1, '#3b82f6'),
      (v_pos_venda_pipeline_id, 'Projeto executivo', 2, '#8b5cf6'),
      (v_pos_venda_pipeline_id, 'Plano de corte', 3, '#f59e0b'),
      (v_pos_venda_pipeline_id, 'Fabricação', 4, '#10b981'),
      (v_pos_venda_pipeline_id, 'Montagem', 5, '#06b6d4'),
      (v_pos_venda_pipeline_id, 'Vistoria final', 6, '#ec4899'),
      (v_pos_venda_pipeline_id, 'Concluído', 7, '#22c55e');

    -- Criar pipeline de assistência técnica
    INSERT INTO public.pipelines (company_id, name, type)
    VALUES (v_company_id, 'Assistência Técnica', 'assistencia')
    RETURNING id INTO v_assistencia_pipeline_id;

    -- Criar estágios de assistência
    INSERT INTO public.stages (pipeline_id, name, position, color) VALUES
      (v_assistencia_pipeline_id, 'Novo chamado', 1, '#3b82f6'),
      (v_assistencia_pipeline_id, 'Em análise', 2, '#8b5cf6'),
      (v_assistencia_pipeline_id, 'Aguardando peça', 3, '#f59e0b'),
      (v_assistencia_pipeline_id, 'Em atendimento', 4, '#10b981'),
      (v_assistencia_pipeline_id, 'Finalizado', 5, '#22c55e');
  END IF;
END $$;

-- 2. Atualizar trigger handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  company_name TEXT;
  new_company_id UUID;
BEGIN
  -- Pegar nome da empresa do metadata
  company_name := NEW.raw_user_meta_data->>'company_name';
  
  IF company_name IS NULL THEN
    company_name := 'Minha Marcenaria';
  END IF;
  
  -- Criar empresa se for primeiro usuário
  INSERT INTO public.companies (name)
  VALUES (company_name)
  RETURNING id INTO new_company_id;
  
  -- Criar profile
  INSERT INTO public.profiles (id, company_id, full_name)
  VALUES (
    NEW.id,
    new_company_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Dar role de admin ao primeiro usuário
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$function$;

-- 3. Atualizar trigger initialize_default_pipelines com flags corretas
CREATE OR REPLACE FUNCTION public.initialize_default_pipelines()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  vendas_pipeline_id UUID;
  pos_venda_pipeline_id UUID;
  assistencia_pipeline_id UUID;
BEGIN
  -- Criar pipeline de vendas
  INSERT INTO public.pipelines (company_id, name, type)
  VALUES (NEW.id, 'Vendas', 'vendas')
  RETURNING id INTO vendas_pipeline_id;

  -- Criar estágios de vendas com flags corretas
  INSERT INTO public.stages (pipeline_id, name, position, color, is_win_stage, is_loss_stage) VALUES
    (vendas_pipeline_id, 'Lead novo', 1, '#3b82f6', false, false),
    (vendas_pipeline_id, 'Triagem', 2, '#8b5cf6', false, false),
    (vendas_pipeline_id, 'Elaboração de projeto', 3, '#f59e0b', false, false),
    (vendas_pipeline_id, 'Apresentação ao cliente', 4, '#10b981', false, false),
    (vendas_pipeline_id, 'Negociação', 5, '#06b6d4', false, false),
    (vendas_pipeline_id, 'Fechado (ganho)', 6, '#22c55e', true, false),
    (vendas_pipeline_id, 'Perda', 7, '#ef4444', false, true);

  -- Criar pipeline de pós-venda
  INSERT INTO public.pipelines (company_id, name, type)
  VALUES (NEW.id, 'Pós-Venda', 'pos_venda')
  RETURNING id INTO pos_venda_pipeline_id;

  -- Criar estágios de pós-venda
  INSERT INTO public.stages (pipeline_id, name, position, color) VALUES
    (pos_venda_pipeline_id, 'Medição in loco', 1, '#3b82f6'),
    (pos_venda_pipeline_id, 'Projeto executivo', 2, '#8b5cf6'),
    (pos_venda_pipeline_id, 'Plano de corte', 3, '#f59e0b'),
    (pos_venda_pipeline_id, 'Fabricação', 4, '#10b981'),
    (pos_venda_pipeline_id, 'Montagem', 5, '#06b6d4'),
    (pos_venda_pipeline_id, 'Vistoria final', 6, '#ec4899'),
    (pos_venda_pipeline_id, 'Concluído', 7, '#22c55e');

  -- Criar pipeline de assistência técnica
  INSERT INTO public.pipelines (company_id, name, type)
  VALUES (NEW.id, 'Assistência Técnica', 'assistencia')
  RETURNING id INTO assistencia_pipeline_id;

  -- Criar estágios de assistência
  INSERT INTO public.stages (pipeline_id, name, position, color) VALUES
    (assistencia_pipeline_id, 'Novo chamado', 1, '#3b82f6'),
    (assistencia_pipeline_id, 'Em análise', 2, '#8b5cf6'),
    (assistencia_pipeline_id, 'Aguardando peça', 3, '#f59e0b'),
    (assistencia_pipeline_id, 'Em atendimento', 4, '#10b981'),
    (assistencia_pipeline_id, 'Finalizado', 5, '#22c55e');

  RETURN NEW;
END;
$function$;