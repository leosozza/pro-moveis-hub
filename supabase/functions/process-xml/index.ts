import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extrair dados do cliente do XML Promob
function extractCustomerData(xml: string): { name: string; phone: string; email: string } {
  const nameMatch = xml.match(/<DATA ID="nomecliente" VALUE="([^"]*)"\/>/i);
  const phoneMatch = xml.match(/<DATA ID="celular" VALUE="([^"]*)"\/>/i);
  const emailMatch = xml.match(/<DATA ID="email" VALUE="([^"]*)"\/>/i);

  return {
    name: nameMatch ? nameMatch[1].trim() : '',
    phone: phoneMatch ? phoneMatch[1].trim() : '',
    email: emailMatch ? emailMatch[1].trim() : '',
  };
}

// Extrair ambientes do XML Promob
function extractAmbients(xml: string): string[] {
  const ambients: string[] = [];
  const ambientRegex = /<AMBIENT[^>]*DESCRIPTION="([^"]*)"[^>]*>/gi;
  let match;

  while ((match = ambientRegex.exec(xml)) !== null) {
    if (match[1] && match[1].trim()) {
      ambients.push(match[1].trim());
    }
  }

  return ambients;
}

// Extrair atributo de tag XML (atributos são UPPERCASE no Promob)
function extractAttribute(itemTag: string, attrName: string): string {
  const regex = new RegExp(`${attrName}="([^"]*)"`, 'i');
  const match = itemTag.match(regex);
  return match ? match[1].trim() : '';
}

// Extrair valor de tag aninhada
function extractNestedValue(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

// Extrair itens do XML Promob
function extractItems(xml: string, ambiente: string): any[] {
  const items: any[] = [];
  
  // Encontrar seção do ambiente
  const ambientRegex = new RegExp(
    `<AMBIENT[^>]*DESCRIPTION="${ambiente}"[^>]*>([\\s\\S]*?)<\\/AMBIENT>`,
    'gi'
  );
  const ambientMatch = xml.match(ambientRegex);
  
  if (!ambientMatch) return items;
  
  const ambientXml = ambientMatch[0];
  
  // Extrair todos os ITEM dentro deste ambiente
  const itemRegex = /<ITEM\s([^>]*)>([\s\S]*?)<\/ITEM>/gi;
  let match;

  while ((match = itemRegex.exec(ambientXml)) !== null) {
    const itemAttributes = match[1];
    const itemContent = match[2];
    
    // Extrair atributos do ITEM
    const descricao = extractAttribute(itemAttributes, 'DESCRIPTION');
    const referencia = extractAttribute(itemAttributes, 'REFERENCE');
    const widthStr = extractAttribute(itemAttributes, 'WIDTH');
    const heightStr = extractAttribute(itemAttributes, 'HEIGHT');
    const depthStr = extractAttribute(itemAttributes, 'DEPTH');
    const quantityStr = extractAttribute(itemAttributes, 'QUANTITY');
    const repetitionStr = extractAttribute(itemAttributes, 'REPETITION');
    const unit = extractAttribute(itemAttributes, 'UNIT');
    
    // Extrair dados de REFERENCES
    const material = extractNestedValue(itemContent, 'MATERIAL');
    const thickness = extractNestedValue(itemContent, 'THICKNESS');
    const model = extractNestedValue(itemContent, 'MODEL');
    
    // Converter valores
    const largura = parseFloat(widthStr) || 0;
    const altura = parseFloat(heightStr) || 0;
    const profundidade = parseFloat(depthStr) || 0;
    const quantidade = parseInt(quantityStr) || parseInt(repetitionStr) || 1;
    
    // Determinar tipo de item baseado na unidade
    const isChapa = unit === 'M2' || unit === 'M²';
    const tipo_item = isChapa ? 'chapa' : 'ferragem';
    
    // Calcular área se for chapa
    let area_m2 = null;
    if (isChapa && largura > 0 && profundidade > 0) {
      area_m2 = (largura / 1000) * (profundidade / 1000);
    }
    
    items.push({
      referencia: referencia || 'SEM REF',
      descricao: descricao || 'Item',
      largura_mm: largura,
      altura_mm: altura,
      profundidade_mm: profundidade,
      quantidade,
      material: material || null,
      modelo: model || null,
      espessura: thickness || null,
      tipo_item,
      area_m2,
      ambiente,
    });
  }

  return items;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { promob_file_id } = await req.json();

    if (!promob_file_id) {
      throw new Error('promob_file_id é obrigatório');
    }

    console.log('Processando arquivo:', promob_file_id);

    // Buscar arquivo do banco
    const { data: fileRecord, error: fileError } = await supabaseClient
      .from('promob_files')
      .select('*')
      .eq('id', promob_file_id)
      .single();

    if (fileError) throw fileError;

    console.log('Arquivo encontrado:', fileRecord.original_filename);

    // Download do arquivo XML
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('project-files')
      .download(fileRecord.file_path);

    if (downloadError) throw downloadError;

    const xmlContent = await fileData.text();
    console.log('XML carregado, tamanho:', xmlContent.length);
    
    // Extrair dados do cliente
    const customerData = extractCustomerData(xmlContent);
    console.log('Cliente:', customerData.name);
    
    // Extrair ambientes
    const ambients = extractAmbients(xmlContent);
    console.log('Ambientes encontrados:', ambients.length);
    
    // Verificar se já existe budget para este projeto
    let budgetId: string;
    const { data: existingBudget } = await supabaseClient
      .from('budgets')
      .select('id')
      .eq('project_id', fileRecord.project_id)
      .eq('customer_id', fileRecord.customer_id)
      .maybeSingle();

    if (existingBudget) {
      budgetId = existingBudget.id;
      console.log('Budget existente:', budgetId);
    } else {
      // Criar novo budget
      const { data: newBudget, error: budgetError } = await supabaseClient
        .from('budgets')
        .insert([{
          company_id: fileRecord.company_id,
          project_id: fileRecord.project_id,
          customer_id: fileRecord.customer_id,
          created_by: fileRecord.uploaded_by,
        }])
        .select()
        .single();

      if (budgetError) throw budgetError;
      budgetId = newBudget.id;
      console.log('Novo budget criado:', budgetId);
    }

    // Processar itens de cada ambiente
    let totalItems = 0;
    for (const ambiente of ambients) {
      const items = extractItems(xmlContent, ambiente);
      console.log(`Ambiente ${ambiente}: ${items.length} itens`);
      
      if (items.length > 0) {
        const budgetItems = items.map(item => ({
          ...item,
          budget_id: budgetId,
          promob_file_id: promob_file_id,
        }));

        // Inserir itens no banco
        const { error: itemsError } = await supabaseClient
          .from('budget_items')
          .insert(budgetItems);

        if (itemsError) {
          console.error('Erro ao inserir itens:', itemsError);
          throw itemsError;
        }

        // Calcular custos e preços para cada item
        for (const item of budgetItems) {
          await calculateItemPrice(supabaseClient, fileRecord.company_id, item);
        }
        
        totalItems += items.length;
      }
    }

    // Atualizar totais do budget
    await updateBudgetTotals(supabaseClient, budgetId);
    
    console.log('Processamento concluído:', totalItems, 'itens');

    return new Response(
      JSON.stringify({ 
        success: true, 
        budget_id: budgetId,
        items_count: totalItems,
        ambients: ambients.length,
        customer: customerData.name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao processar XML:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function calculateItemPrice(supabase: any, companyId: string, item: any) {
  try {
    // Buscar tabela de preços ativa
    const { data: priceTable } = await supabase
      .from('price_tables')
      .select('id')
      .eq('company_id', companyId)
      .eq('active', true)
      .maybeSingle();

    if (!priceTable) {
      console.log('Nenhuma tabela de preços ativa encontrada');
      return;
    }

    let custoUnitario = 0;
    let semPreco = false;

    if (item.tipo_item === 'chapa' && item.area_m2 && item.espessura && item.material) {
      // Buscar preço da chapa
      const { data: sheetPrice } = await supabase
        .from('sheet_prices')
        .select('preco_m2')
        .eq('price_table_id', priceTable.id)
        .eq('material', item.material)
        .eq('espessura', item.espessura)
        .maybeSingle();

      if (sheetPrice) {
        // Buscar configuração de perda
        const { data: company } = await supabase
          .from('companies')
          .select('perda_chapa_percentual')
          .eq('id', companyId)
          .single();

        const perdaPercent = company?.perda_chapa_percentual || 10;
        const areaComPerda = item.area_m2 * (1 + perdaPercent / 100);
        custoUnitario = areaComPerda * sheetPrice.preco_m2;
      } else {
        semPreco = true;
        console.log('Preço não encontrado para chapa:', item.material, item.espessura);
      }
    } else if (item.tipo_item === 'ferragem' && item.referencia) {
      // Buscar preço da ferragem
      const { data: hardwarePrice } = await supabase
        .from('hardware_prices')
        .select('preco_unitario')
        .eq('price_table_id', priceTable.id)
        .eq('referencia', item.referencia)
        .maybeSingle();

      if (hardwarePrice) {
        custoUnitario = hardwarePrice.preco_unitario;
      } else {
        semPreco = true;
        console.log('Preço não encontrado para ferragem:', item.referencia);
      }
    }

    const custoTotal = custoUnitario * item.quantidade;

    // Buscar margem aplicável
    let margemPercent = 0;
    
    const { data: marginRule } = await supabase
      .from('margin_rules')
      .select('margem_percentual')
      .eq('company_id', companyId)
      .eq('tipo_item', item.tipo_item)
      .or(`ambiente.eq.${item.ambiente},ambiente.is.null`)
      .order('ambiente', { ascending: false, nullsLast: true })
      .maybeSingle();

    if (marginRule) {
      margemPercent = marginRule.margem_percentual;
    } else {
      // Usar margem padrão
      const { data: company } = await supabase
        .from('companies')
        .select('margem_padrao_chapa, margem_padrao_ferragem')
        .eq('id', companyId)
        .single();

      margemPercent = item.tipo_item === 'chapa' 
        ? (company?.margem_padrao_chapa || 40)
        : (company?.margem_padrao_ferragem || 30);
    }

    const precoUnitario = custoUnitario * (1 + margemPercent / 100);
    const precoTotal = precoUnitario * item.quantidade;

    // Atualizar item com os valores calculados
    await supabase
      .from('budget_items')
      .update({
        custo_unitario: custoUnitario,
        custo_total: custoTotal,
        preco_unitario: precoUnitario,
        preco_total: precoTotal,
        sem_preco: semPreco,
      })
      .eq('budget_id', item.budget_id)
      .eq('ambiente', item.ambiente)
      .eq('referencia', item.referencia);

  } catch (error) {
    console.error('Erro ao calcular preço do item:', error);
  }
}

async function updateBudgetTotals(supabase: any, budgetId: string) {
  try {
    const { data: items } = await supabase
      .from('budget_items')
      .select('custo_total, preco_total')
      .eq('budget_id', budgetId);

    if (!items) return;

    const totalCusto = items.reduce((sum: number, item: any) => sum + (item.custo_total || 0), 0);
    const totalPreco = items.reduce((sum: number, item: any) => sum + (item.preco_total || 0), 0);

    await supabase
      .from('budgets')
      .update({
        total_custo: totalCusto,
        total_preco: totalPreco,
      })
      .eq('id', budgetId);

    console.log('Totais atualizados - Custo:', totalCusto, 'Preço:', totalPreco);

  } catch (error) {
    console.error('Erro ao atualizar totais do budget:', error);
  }
}