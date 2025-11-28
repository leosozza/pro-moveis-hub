import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função auxiliar para extrair valores de tags XML
function extractXmlValue(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

// Função auxiliar para extrair todos os itens
function extractItems(xml: string): any[] {
  const items: any[] = [];
  const itemRegex = /<Item[^>]*>([\s\S]*?)<\/Item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    
    const referencia = extractXmlValue(itemXml, 'Referencia') || extractXmlValue(itemXml, 'Codigo');
    const descricao = extractXmlValue(itemXml, 'Descricao') || extractXmlValue(itemXml, 'Nome') || 'Item';
    const larguraStr = extractXmlValue(itemXml, 'Largura') || extractXmlValue(itemXml, 'Width');
    const alturaStr = extractXmlValue(itemXml, 'Altura') || extractXmlValue(itemXml, 'Height');
    const profundidadeStr = extractXmlValue(itemXml, 'Profundidade') || extractXmlValue(itemXml, 'Depth');
    const quantidadeStr = extractXmlValue(itemXml, 'Quantidade') || extractXmlValue(itemXml, 'Repeticao') || '1';
    const material = extractXmlValue(itemXml, 'Material');
    const modelo = extractXmlValue(itemXml, 'Modelo');
    const espessura = extractXmlValue(itemXml, 'Espessura');

    const largura = parseFloat(larguraStr) || 0;
    const altura = parseFloat(alturaStr) || 0;
    const profundidade = parseFloat(profundidadeStr) || 0;
    const quantidade = parseInt(quantidadeStr) || 1;

    // Determinar tipo de item baseado em palavras-chave
    const refLower = referencia.toLowerCase();
    const descLower = descricao.toLowerCase();
    const isFerrragem = 
      refLower.includes('ferr') || 
      refLower.includes('pux') || 
      refLower.includes('dob') ||
      refLower.includes('corr') ||
      descLower.includes('ferragem') ||
      descLower.includes('puxador') ||
      descLower.includes('dobradiça');

    items.push({
      referencia,
      descricao,
      largura_mm: largura,
      altura_mm: altura,
      profundidade_mm: profundidade,
      quantidade,
      material: material || null,
      modelo: modelo || null,
      espessura: espessura || null,
      tipo_item: isFerrragem ? 'ferragem' : 'chapa',
      area_m2: !isFerrragem && largura > 0 && profundidade > 0 
        ? (largura / 1000) * (profundidade / 1000) 
        : null,
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

    // Buscar arquivo do banco
    const { data: fileRecord, error: fileError } = await supabaseClient
      .from('promob_files')
      .select('*')
      .eq('id', promob_file_id)
      .single();

    if (fileError) throw fileError;

    // Download do arquivo XML
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('project-files')
      .download(fileRecord.file_path);

    if (downloadError) throw downloadError;

    const xmlContent = await fileData.text();
    
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
    }

    // Extrair itens do XML
    const items = extractItems(xmlContent);
    const budgetItems = items.map(item => ({
      ...item,
      budget_id: budgetId,
      promob_file_id: promob_file_id,
      ambiente: fileRecord.ambiente,
    }));

    // Inserir itens no banco
    if (budgetItems.length > 0) {
      const { error: itemsError } = await supabaseClient
        .from('budget_items')
        .insert(budgetItems);

      if (itemsError) throw itemsError;

      // Calcular custos e preços para cada item
      for (const item of budgetItems) {
        await calculateItemPrice(supabaseClient, fileRecord.company_id, item);
      }

      // Atualizar totais do budget
      await updateBudgetTotals(supabaseClient, budgetId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        budget_id: budgetId,
        items_count: budgetItems.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
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

    if (!priceTable) return;

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

  } catch (error) {
    console.error('Erro ao atualizar totais do budget:', error);
  }
}