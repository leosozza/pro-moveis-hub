CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'projetista',
    'vendedor',
    'pos_venda',
    'montador',
    'assistencia'
);


--
-- Name: get_user_company_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_company_id(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
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
$$;


--
-- Name: has_role(uuid, public.user_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.user_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;


--
-- Name: initialize_default_pipelines(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.initialize_default_pipelines() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  vendas_pipeline_id UUID;
  pos_venda_pipeline_id UUID;
  assistencia_pipeline_id UUID;
BEGIN
  -- Criar pipeline de vendas
  INSERT INTO public.pipelines (company_id, name, type)
  VALUES (NEW.id, 'Vendas', 'vendas')
  RETURNING id INTO vendas_pipeline_id;

  -- Criar estágios de vendas
  INSERT INTO public.stages (pipeline_id, name, position, color) VALUES
    (vendas_pipeline_id, 'Lead novo', 1, '#3b82f6'),
    (vendas_pipeline_id, 'Triagem', 2, '#8b5cf6'),
    (vendas_pipeline_id, 'Elaboração de projeto', 3, '#f59e0b'),
    (vendas_pipeline_id, 'Apresentação ao cliente', 4, '#10b981'),
    (vendas_pipeline_id, 'Negociação', 5, '#06b6d4'),
    (vendas_pipeline_id, 'Fechado (ganho)', 6, '#22c55e'),
    (vendas_pipeline_id, 'Perda', 7, '#ef4444');

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
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: assembly_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assembly_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    deal_id uuid,
    project_id uuid NOT NULL,
    montador_id uuid,
    scheduled_date timestamp with time zone,
    assembly_value numeric,
    status text DEFAULT 'agendada'::text NOT NULL,
    material_request text,
    observations text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT assembly_orders_status_check CHECK ((status = ANY (ARRAY['agendada'::text, 'em_andamento'::text, 'concluida'::text])))
);


--
-- Name: assembly_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assembly_photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assembly_order_id uuid NOT NULL,
    photo_url text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: budget_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.budget_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    budget_id uuid NOT NULL,
    promob_file_id uuid,
    ambiente text NOT NULL,
    referencia text,
    descricao text NOT NULL,
    largura_mm numeric(10,2),
    altura_mm numeric(10,2),
    profundidade_mm numeric(10,2),
    quantidade integer DEFAULT 1,
    material text,
    modelo text,
    espessura text,
    tipo_item text DEFAULT 'chapa'::text,
    area_m2 numeric(10,4),
    custo_unitario numeric(10,2) DEFAULT 0,
    custo_total numeric(10,2) DEFAULT 0,
    preco_unitario numeric(10,2) DEFAULT 0,
    preco_total numeric(10,2) DEFAULT 0,
    sem_preco boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: budgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.budgets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    project_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    version integer DEFAULT 1,
    total_custo numeric(12,2) DEFAULT 0,
    total_preco numeric(12,2) DEFAULT 0,
    observacoes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    cnpj text,
    phone text,
    email text,
    address text,
    margem_padrao_chapa numeric(5,2) DEFAULT 40.00,
    margem_padrao_ferragem numeric(5,2) DEFAULT 30.00,
    perda_chapa_percentual numeric(5,2) DEFAULT 10.00,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    whatsapp text,
    phone text,
    email text,
    cpf_cnpj text,
    address text,
    city text,
    state text,
    zip_code text,
    origem text,
    observacoes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: deals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    project_id uuid,
    pipeline_id uuid NOT NULL,
    stage_id uuid NOT NULL,
    responsible_id uuid,
    title text NOT NULL,
    description text,
    estimated_value numeric,
    final_value numeric,
    expected_close_date date,
    actual_close_date date,
    status text DEFAULT 'ativo'::text,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT deals_status_check CHECK ((status = ANY (ARRAY['ativo'::text, 'ganho'::text, 'perdido'::text])))
);


--
-- Name: final_inspections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.final_inspections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assembly_order_id uuid NOT NULL,
    customer_name text NOT NULL,
    approved boolean NOT NULL,
    observations text,
    signature_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hardware_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hardware_prices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    price_table_id uuid NOT NULL,
    referencia text NOT NULL,
    descricao text,
    preco_unitario numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: margin_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.margin_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    tipo_item text NOT NULL,
    tipo_cliente text,
    ambiente text,
    margem_percentual numeric(5,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pipelines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pipelines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pipelines_type_check CHECK ((type = ANY (ARRAY['vendas'::text, 'pos_venda'::text, 'assistencia'::text])))
);


--
-- Name: price_tables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_tables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    company_id uuid NOT NULL,
    full_name text NOT NULL,
    phone text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'em_elaboracao'::text,
    projetista_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: promob_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promob_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    project_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    ambiente text NOT NULL,
    file_path text NOT NULL,
    original_filename text NOT NULL,
    file_type text DEFAULT 'vendido'::text,
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: service_ticket_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_ticket_photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_ticket_id uuid NOT NULL,
    photo_url text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: service_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    project_id uuid,
    pipeline_id uuid NOT NULL,
    stage_id uuid NOT NULL,
    responsible_id uuid,
    title text NOT NULL,
    description text NOT NULL,
    priority text DEFAULT 'media'::text,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT service_tickets_priority_check CHECK ((priority = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'urgente'::text])))
);


--
-- Name: sheet_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sheet_prices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    price_table_id uuid NOT NULL,
    material text NOT NULL,
    marca text,
    espessura text NOT NULL,
    preco_m2 numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: stages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pipeline_id uuid NOT NULL,
    name text NOT NULL,
    "position" integer NOT NULL,
    color text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.user_role NOT NULL
);


--
-- Name: xml_comparisons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.xml_comparisons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    vendido_snapshot_id uuid NOT NULL,
    executivo_snapshot_id uuid NOT NULL,
    cost_difference numeric DEFAULT 0 NOT NULL,
    cost_difference_percent numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: xml_cost_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.xml_cost_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    promob_file_id uuid NOT NULL,
    file_type text NOT NULL,
    total_cost numeric DEFAULT 0 NOT NULL,
    total_items integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT xml_cost_snapshots_file_type_check CHECK ((file_type = ANY (ARRAY['vendido'::text, 'executivo'::text])))
);


--
-- Name: assembly_orders assembly_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assembly_orders
    ADD CONSTRAINT assembly_orders_pkey PRIMARY KEY (id);


--
-- Name: assembly_photos assembly_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assembly_photos
    ADD CONSTRAINT assembly_photos_pkey PRIMARY KEY (id);


--
-- Name: budget_items budget_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_pkey PRIMARY KEY (id);


--
-- Name: budgets budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_pkey PRIMARY KEY (id);


--
-- Name: final_inspections final_inspections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.final_inspections
    ADD CONSTRAINT final_inspections_pkey PRIMARY KEY (id);


--
-- Name: hardware_prices hardware_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hardware_prices
    ADD CONSTRAINT hardware_prices_pkey PRIMARY KEY (id);


--
-- Name: margin_rules margin_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.margin_rules
    ADD CONSTRAINT margin_rules_pkey PRIMARY KEY (id);


--
-- Name: pipelines pipelines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT pipelines_pkey PRIMARY KEY (id);


--
-- Name: price_tables price_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_tables
    ADD CONSTRAINT price_tables_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: promob_files promob_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promob_files
    ADD CONSTRAINT promob_files_pkey PRIMARY KEY (id);


--
-- Name: service_ticket_photos service_ticket_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_ticket_photos
    ADD CONSTRAINT service_ticket_photos_pkey PRIMARY KEY (id);


--
-- Name: service_tickets service_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_tickets
    ADD CONSTRAINT service_tickets_pkey PRIMARY KEY (id);


--
-- Name: sheet_prices sheet_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sheet_prices
    ADD CONSTRAINT sheet_prices_pkey PRIMARY KEY (id);


--
-- Name: stages stages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stages
    ADD CONSTRAINT stages_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: xml_comparisons xml_comparisons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xml_comparisons
    ADD CONSTRAINT xml_comparisons_pkey PRIMARY KEY (id);


--
-- Name: xml_cost_snapshots xml_cost_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xml_cost_snapshots
    ADD CONSTRAINT xml_cost_snapshots_pkey PRIMARY KEY (id);


--
-- Name: companies on_company_created_initialize_pipelines; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_company_created_initialize_pipelines AFTER INSERT ON public.companies FOR EACH ROW EXECUTE FUNCTION public.initialize_default_pipelines();


--
-- Name: assembly_orders update_assembly_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_assembly_orders_updated_at BEFORE UPDATE ON public.assembly_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: budgets update_budgets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: companies update_companies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: customers update_customers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: deals update_deals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: hardware_prices update_hardware_prices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_hardware_prices_updated_at BEFORE UPDATE ON public.hardware_prices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: margin_rules update_margin_rules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_margin_rules_updated_at BEFORE UPDATE ON public.margin_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pipelines update_pipelines_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON public.pipelines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: price_tables update_price_tables_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_price_tables_updated_at BEFORE UPDATE ON public.price_tables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: service_tickets update_service_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_service_tickets_updated_at BEFORE UPDATE ON public.service_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sheet_prices update_sheet_prices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sheet_prices_updated_at BEFORE UPDATE ON public.sheet_prices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: assembly_orders assembly_orders_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assembly_orders
    ADD CONSTRAINT assembly_orders_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: assembly_orders assembly_orders_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assembly_orders
    ADD CONSTRAINT assembly_orders_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id);


--
-- Name: assembly_orders assembly_orders_montador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assembly_orders
    ADD CONSTRAINT assembly_orders_montador_id_fkey FOREIGN KEY (montador_id) REFERENCES public.profiles(id);


--
-- Name: assembly_orders assembly_orders_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assembly_orders
    ADD CONSTRAINT assembly_orders_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: assembly_photos assembly_photos_assembly_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assembly_photos
    ADD CONSTRAINT assembly_photos_assembly_order_id_fkey FOREIGN KEY (assembly_order_id) REFERENCES public.assembly_orders(id) ON DELETE CASCADE;


--
-- Name: budget_items budget_items_budget_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.budgets(id) ON DELETE CASCADE;


--
-- Name: budget_items budget_items_promob_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_promob_file_id_fkey FOREIGN KEY (promob_file_id) REFERENCES public.promob_files(id);


--
-- Name: budgets budgets_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: budgets budgets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: budgets budgets_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: budgets budgets_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: customers customers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: customers customers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: deals deals_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: deals deals_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: deals deals_pipeline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id);


--
-- Name: deals deals_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: deals deals_responsible_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_responsible_id_fkey FOREIGN KEY (responsible_id) REFERENCES public.profiles(id);


--
-- Name: deals deals_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.stages(id);


--
-- Name: final_inspections final_inspections_assembly_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.final_inspections
    ADD CONSTRAINT final_inspections_assembly_order_id_fkey FOREIGN KEY (assembly_order_id) REFERENCES public.assembly_orders(id) ON DELETE CASCADE;


--
-- Name: hardware_prices hardware_prices_price_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hardware_prices
    ADD CONSTRAINT hardware_prices_price_table_id_fkey FOREIGN KEY (price_table_id) REFERENCES public.price_tables(id) ON DELETE CASCADE;


--
-- Name: margin_rules margin_rules_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.margin_rules
    ADD CONSTRAINT margin_rules_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: pipelines pipelines_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT pipelines_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: price_tables price_tables_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_tables
    ADD CONSTRAINT price_tables_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: projects projects_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: projects projects_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: projects projects_projetista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_projetista_id_fkey FOREIGN KEY (projetista_id) REFERENCES public.profiles(id);


--
-- Name: promob_files promob_files_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promob_files
    ADD CONSTRAINT promob_files_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: promob_files promob_files_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promob_files
    ADD CONSTRAINT promob_files_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: promob_files promob_files_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promob_files
    ADD CONSTRAINT promob_files_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: promob_files promob_files_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promob_files
    ADD CONSTRAINT promob_files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id);


--
-- Name: service_ticket_photos service_ticket_photos_service_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_ticket_photos
    ADD CONSTRAINT service_ticket_photos_service_ticket_id_fkey FOREIGN KEY (service_ticket_id) REFERENCES public.service_tickets(id) ON DELETE CASCADE;


--
-- Name: service_tickets service_tickets_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_tickets
    ADD CONSTRAINT service_tickets_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: service_tickets service_tickets_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_tickets
    ADD CONSTRAINT service_tickets_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: service_tickets service_tickets_pipeline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_tickets
    ADD CONSTRAINT service_tickets_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id);


--
-- Name: service_tickets service_tickets_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_tickets
    ADD CONSTRAINT service_tickets_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: service_tickets service_tickets_responsible_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_tickets
    ADD CONSTRAINT service_tickets_responsible_id_fkey FOREIGN KEY (responsible_id) REFERENCES public.profiles(id);


--
-- Name: service_tickets service_tickets_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_tickets
    ADD CONSTRAINT service_tickets_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.stages(id);


--
-- Name: sheet_prices sheet_prices_price_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sheet_prices
    ADD CONSTRAINT sheet_prices_price_table_id_fkey FOREIGN KEY (price_table_id) REFERENCES public.price_tables(id) ON DELETE CASCADE;


--
-- Name: stages stages_pipeline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stages
    ADD CONSTRAINT stages_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: xml_comparisons xml_comparisons_executivo_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xml_comparisons
    ADD CONSTRAINT xml_comparisons_executivo_snapshot_id_fkey FOREIGN KEY (executivo_snapshot_id) REFERENCES public.xml_cost_snapshots(id);


--
-- Name: xml_comparisons xml_comparisons_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xml_comparisons
    ADD CONSTRAINT xml_comparisons_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: xml_comparisons xml_comparisons_vendido_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xml_comparisons
    ADD CONSTRAINT xml_comparisons_vendido_snapshot_id_fkey FOREIGN KEY (vendido_snapshot_id) REFERENCES public.xml_cost_snapshots(id);


--
-- Name: xml_cost_snapshots xml_cost_snapshots_promob_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xml_cost_snapshots
    ADD CONSTRAINT xml_cost_snapshots_promob_file_id_fkey FOREIGN KEY (promob_file_id) REFERENCES public.promob_files(id);


--
-- Name: companies Admins podem atualizar empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem atualizar empresa" ON public.companies FOR UPDATE TO authenticated USING (((id = public.get_user_company_id(auth.uid())) AND public.has_role(auth.uid(), 'admin'::public.user_role)));


--
-- Name: pipelines Admins podem gerenciar pipelines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar pipelines" ON public.pipelines USING (((company_id = public.get_user_company_id(auth.uid())) AND public.has_role(auth.uid(), 'admin'::public.user_role)));


--
-- Name: sheet_prices Admins podem gerenciar preços de chapas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar preços de chapas" ON public.sheet_prices TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.price_tables
  WHERE ((price_tables.id = sheet_prices.price_table_id) AND (price_tables.company_id = public.get_user_company_id(auth.uid()))))) AND public.has_role(auth.uid(), 'admin'::public.user_role)));


--
-- Name: hardware_prices Admins podem gerenciar preços de ferragens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar preços de ferragens" ON public.hardware_prices TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.price_tables
  WHERE ((price_tables.id = hardware_prices.price_table_id) AND (price_tables.company_id = public.get_user_company_id(auth.uid()))))) AND public.has_role(auth.uid(), 'admin'::public.user_role)));


--
-- Name: margin_rules Admins podem gerenciar regras de margem; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar regras de margem" ON public.margin_rules TO authenticated USING (((company_id = public.get_user_company_id(auth.uid())) AND public.has_role(auth.uid(), 'admin'::public.user_role)));


--
-- Name: user_roles Admins podem gerenciar roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar roles" ON public.user_roles TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.user_role) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = user_roles.user_id) AND (profiles.company_id = public.get_user_company_id(auth.uid())))))));


--
-- Name: price_tables Admins podem gerenciar tabelas de preço; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar tabelas de preço" ON public.price_tables TO authenticated USING (((company_id = public.get_user_company_id(auth.uid())) AND public.has_role(auth.uid(), 'admin'::public.user_role)));


--
-- Name: assembly_orders Montadores podem atualizar suas montagens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Montadores podem atualizar suas montagens" ON public.assembly_orders FOR UPDATE USING (((company_id = public.get_user_company_id(auth.uid())) AND ((montador_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.user_role) OR public.has_role(auth.uid(), 'pos_venda'::public.user_role))));


--
-- Name: assembly_photos Montadores podem criar fotos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Montadores podem criar fotos" ON public.assembly_photos FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.assembly_orders
  WHERE ((assembly_orders.id = assembly_photos.assembly_order_id) AND (assembly_orders.montador_id = auth.uid())))));


--
-- Name: final_inspections Montadores podem criar vistorias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Montadores podem criar vistorias" ON public.final_inspections FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.assembly_orders
  WHERE ((assembly_orders.id = final_inspections.assembly_order_id) AND (assembly_orders.montador_id = auth.uid())))));


--
-- Name: budgets Projetistas podem atualizar orçamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Projetistas podem atualizar orçamentos" ON public.budgets FOR UPDATE TO authenticated USING (((company_id = public.get_user_company_id(auth.uid())) AND (public.has_role(auth.uid(), 'projetista'::public.user_role) OR public.has_role(auth.uid(), 'admin'::public.user_role))));


--
-- Name: projects Projetistas podem atualizar projetos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Projetistas podem atualizar projetos" ON public.projects FOR UPDATE TO authenticated USING (((company_id = public.get_user_company_id(auth.uid())) AND (public.has_role(auth.uid(), 'projetista'::public.user_role) OR public.has_role(auth.uid(), 'admin'::public.user_role))));


--
-- Name: promob_files Projetistas podem criar arquivos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Projetistas podem criar arquivos" ON public.promob_files FOR INSERT TO authenticated WITH CHECK (((company_id = public.get_user_company_id(auth.uid())) AND (public.has_role(auth.uid(), 'projetista'::public.user_role) OR public.has_role(auth.uid(), 'admin'::public.user_role))));


--
-- Name: xml_comparisons Projetistas podem criar comparações; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Projetistas podem criar comparações" ON public.xml_comparisons FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = xml_comparisons.project_id) AND (projects.company_id = public.get_user_company_id(auth.uid()))))) AND (public.has_role(auth.uid(), 'projetista'::public.user_role) OR public.has_role(auth.uid(), 'admin'::public.user_role))));


--
-- Name: budget_items Projetistas podem criar itens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Projetistas podem criar itens" ON public.budget_items FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM public.budgets
  WHERE ((budgets.id = budget_items.budget_id) AND (budgets.company_id = public.get_user_company_id(auth.uid()))))) AND (public.has_role(auth.uid(), 'projetista'::public.user_role) OR public.has_role(auth.uid(), 'admin'::public.user_role))));


--
-- Name: budgets Projetistas podem criar orçamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Projetistas podem criar orçamentos" ON public.budgets FOR INSERT TO authenticated WITH CHECK (((company_id = public.get_user_company_id(auth.uid())) AND (public.has_role(auth.uid(), 'projetista'::public.user_role) OR public.has_role(auth.uid(), 'admin'::public.user_role))));


--
-- Name: projects Projetistas podem criar projetos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Projetistas podem criar projetos" ON public.projects FOR INSERT TO authenticated WITH CHECK (((company_id = public.get_user_company_id(auth.uid())) AND (public.has_role(auth.uid(), 'projetista'::public.user_role) OR public.has_role(auth.uid(), 'admin'::public.user_role))));


--
-- Name: xml_cost_snapshots Projetistas podem criar snapshots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Projetistas podem criar snapshots" ON public.xml_cost_snapshots FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM public.promob_files
  WHERE ((promob_files.id = xml_cost_snapshots.promob_file_id) AND (promob_files.company_id = public.get_user_company_id(auth.uid()))))) AND (public.has_role(auth.uid(), 'projetista'::public.user_role) OR public.has_role(auth.uid(), 'admin'::public.user_role))));


--
-- Name: service_tickets Responsáveis podem atualizar chamados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Responsáveis podem atualizar chamados" ON public.service_tickets FOR UPDATE USING (((company_id = public.get_user_company_id(auth.uid())) AND ((responsible_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.user_role) OR public.has_role(auth.uid(), 'assistencia'::public.user_role))));


--
-- Name: profiles Sistema pode criar perfis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sistema pode criar perfis" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: customers Usuários podem atualizar clientes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem atualizar clientes" ON public.customers FOR UPDATE TO authenticated USING ((company_id = public.get_user_company_id(auth.uid())));


--
-- Name: deals Usuários podem atualizar deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem atualizar deals" ON public.deals FOR UPDATE USING ((company_id = public.get_user_company_id(auth.uid())));


--
-- Name: profiles Usuários podem atualizar seu perfil; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem atualizar seu perfil" ON public.profiles FOR UPDATE TO authenticated USING ((id = auth.uid()));


--
-- Name: service_tickets Usuários podem criar chamados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem criar chamados" ON public.service_tickets FOR INSERT WITH CHECK ((company_id = public.get_user_company_id(auth.uid())));


--
-- Name: customers Usuários podem criar clientes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem criar clientes" ON public.customers FOR INSERT TO authenticated WITH CHECK ((company_id = public.get_user_company_id(auth.uid())));


--
-- Name: deals Usuários podem criar deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem criar deals" ON public.deals FOR INSERT WITH CHECK ((company_id = public.get_user_company_id(auth.uid())));


--
-- Name: service_ticket_photos Usuários podem criar fotos de chamados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem criar fotos de chamados" ON public.service_ticket_photos FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.service_tickets
  WHERE ((service_tickets.id = service_ticket_photos.service_ticket_id) AND (service_tickets.company_id = public.get_user_company_id(auth.uid()))))));


--
-- Name: assembly_orders Usuários podem criar montagens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem criar montagens" ON public.assembly_orders FOR INSERT WITH CHECK ((company_id = public.get_user_company_id(auth.uid())));


--
-- Name: promob_files Usuários podem ver arquivos da empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver arquivos da empresa" ON public.promob_files FOR SELECT TO authenticated USING ((company_id = public.get_user_company_id(auth.uid())));


--
-- Name: service_tickets Usuários podem ver chamados da empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver chamados da empresa" ON public.service_tickets FOR SELECT USING ((company_id = public.get_user_company_id(auth.uid())));


--
-- Name: customers Usuários podem ver clientes da empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver clientes da empresa" ON public.customers FOR SELECT TO authenticated USING ((company_id = public.get_user_company_id(auth.uid())));


--
-- Name: xml_comparisons Usuários podem ver comparações da empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver comparações da empresa" ON public.xml_comparisons FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = xml_comparisons.project_id) AND (projects.company_id = public.get_user_company_id(auth.uid()))))));


--
-- Name: deals Usuários podem ver deals da empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver deals da empresa" ON public.deals FOR SELECT USING ((company_id = public.get_user_company_id(auth.uid())));


--
-- Name: stages Usuários podem ver estágios da empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver estágios da empresa" ON public.stages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.pipelines
  WHERE ((pipelines.id = stages.pipeline_id) AND (pipelines.company_id = public.get_user_company_id(auth.uid()))))));


--
-- Name: service_ticket_photos Usuários podem ver fotos de chamados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver fotos de chamados" ON public.service_ticket_photos FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.service_tickets
  WHERE ((service_tickets.id = service_ticket_photos.service_ticket_id) AND (service_tickets.company_id = public.get_user_company_id(auth.uid()))))));


--
-- Name: assembly_photos Usuários podem ver fotos de montagem; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver fotos de montagem" ON public.assembly_photos FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.assembly_orders
  WHERE ((assembly_orders.id = assembly_photos.assembly_order_id) AND (assembly_orders.company_id = public.get_user_company_id(auth.uid()))))));


--
-- Name: budget_items Usuários podem ver itens da empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver itens da empresa" ON public.budget_items FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.budgets
  WHERE ((budgets.id = budget_items.budget_id) AND (budgets.company_id = public.get_user_company_id(auth.uid()))))));


--
-- Name: assembly_orders Usuários podem ver montagens da empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver montagens da empresa" ON public.assembly_orders FOR SELECT USING ((company_id = public.get_user_company_id(auth.uid())));


--
-- Name: budgets Usuários podem ver orçamentos da empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver orçamentos da empresa" ON public.budgets FOR SELECT TO authenticated USING ((company_id = public.get_user_company_id(auth.uid())));


--
-- Name: profiles Usuários podem ver perfis da empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver perfis da empresa" ON public.profiles FOR SELECT TO authenticated USING ((company_id = public.get_user_company_id(auth.uid())));


--
-- Name: pipelines Usuários podem ver pipelines da empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver pipelines da empresa" ON public.pipelines FOR SELECT USING ((company_id = public.get_user_company_id(auth.uid())));


--
-- Name: sheet_prices Usuários podem ver preços de chapas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver preços de chapas" ON public.sheet_prices FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.price_tables
  WHERE ((price_tables.id = sheet_prices.price_table_id) AND (price_tables.company_id = public.get_user_company_id(auth.uid()))))));


--
-- Name: hardware_prices Usuários podem ver preços de ferragens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver preços de ferragens" ON public.hardware_prices FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.price_tables
  WHERE ((price_tables.id = hardware_prices.price_table_id) AND (price_tables.company_id = public.get_user_company_id(auth.uid()))))));


--
-- Name: projects Usuários podem ver projetos da empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver projetos da empresa" ON public.projects FOR SELECT TO authenticated USING ((company_id = public.get_user_company_id(auth.uid())));


--
-- Name: margin_rules Usuários podem ver regras de margem da empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver regras de margem da empresa" ON public.margin_rules FOR SELECT TO authenticated USING ((company_id = public.get_user_company_id(auth.uid())));


--
-- Name: user_roles Usuários podem ver roles da empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver roles da empresa" ON public.user_roles FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = user_roles.user_id) AND (profiles.company_id = public.get_user_company_id(auth.uid()))))));


--
-- Name: xml_cost_snapshots Usuários podem ver snapshots da empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver snapshots da empresa" ON public.xml_cost_snapshots FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.promob_files
  WHERE ((promob_files.id = xml_cost_snapshots.promob_file_id) AND (promob_files.company_id = public.get_user_company_id(auth.uid()))))));


--
-- Name: companies Usuários podem ver sua empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver sua empresa" ON public.companies FOR SELECT TO authenticated USING ((id = public.get_user_company_id(auth.uid())));


--
-- Name: price_tables Usuários podem ver tabelas de preço da empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver tabelas de preço da empresa" ON public.price_tables FOR SELECT TO authenticated USING ((company_id = public.get_user_company_id(auth.uid())));


--
-- Name: final_inspections Usuários podem ver vistorias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver vistorias" ON public.final_inspections FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.assembly_orders
  WHERE ((assembly_orders.id = final_inspections.assembly_order_id) AND (assembly_orders.company_id = public.get_user_company_id(auth.uid()))))));


--
-- Name: assembly_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assembly_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: assembly_photos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assembly_photos ENABLE ROW LEVEL SECURITY;

--
-- Name: budget_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

--
-- Name: budgets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

--
-- Name: companies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: deals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

--
-- Name: final_inspections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.final_inspections ENABLE ROW LEVEL SECURITY;

--
-- Name: hardware_prices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hardware_prices ENABLE ROW LEVEL SECURITY;

--
-- Name: margin_rules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.margin_rules ENABLE ROW LEVEL SECURITY;

--
-- Name: pipelines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;

--
-- Name: price_tables; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.price_tables ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: promob_files; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.promob_files ENABLE ROW LEVEL SECURITY;

--
-- Name: service_ticket_photos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_ticket_photos ENABLE ROW LEVEL SECURITY;

--
-- Name: service_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: sheet_prices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sheet_prices ENABLE ROW LEVEL SECURITY;

--
-- Name: stages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: xml_comparisons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.xml_comparisons ENABLE ROW LEVEL SECURITY;

--
-- Name: xml_cost_snapshots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.xml_cost_snapshots ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


