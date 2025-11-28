import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, AlertCircle, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Orcamentos = () => {
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);

  const { data: budgets, isLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select(`
          *,
          customers:customer_id(name),
          projects:project_id(name),
          profiles:created_by(full_name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: budgetItems } = useQuery({
    queryKey: ["budget_items", selectedBudget],
    queryFn: async () => {
      if (!selectedBudget) return [];
      const { data, error } = await supabase
        .from("budget_items")
        .select("*")
        .eq("budget_id", selectedBudget)
        .order("ambiente");
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBudget,
  });

  // Agrupar itens por ambiente
  const itemsByAmbiente = budgetItems?.reduce((acc: any, item: any) => {
    if (!acc[item.ambiente]) {
      acc[item.ambiente] = [];
    }
    acc[item.ambiente].push(item);
    return acc;
  }, {});

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Orçamentos</h1>
        <p className="text-muted-foreground">Visualize orçamentos gerados a partir dos XMLs</p>
      </div>

      {budgets?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">Nenhum orçamento encontrado</CardTitle>
            <CardDescription>
              Faça upload de arquivos XML na área de Projetos para gerar orçamentos
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {budgets?.map((budget: any) => (
            <Card key={budget.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{budget.projects?.name}</CardTitle>
                    <CardDescription>
                      Cliente: {budget.customers?.name} • 
                      Versão: {budget.version} •
                      Criado por: {budget.profiles?.full_name}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(budget.total_preco)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Custo: {formatCurrency(budget.total_custo)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant={selectedBudget === budget.id ? "default" : "outline"}
                  onClick={() => setSelectedBudget(budget.id)}
                  className="w-full"
                >
                  {selectedBudget === budget.id ? "Ocultar Detalhes" : "Ver Detalhes"}
                </Button>

                {selectedBudget === budget.id && itemsByAmbiente && (
                  <div className="mt-6">
                    <Tabs defaultValue={Object.keys(itemsByAmbiente)[0]}>
                      <TabsList>
                        {Object.keys(itemsByAmbiente).map((ambiente) => (
                          <TabsTrigger key={ambiente} value={ambiente}>
                            {ambiente}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {Object.entries(itemsByAmbiente).map(([ambiente, items]: [string, any]) => (
                        <TabsContent key={ambiente} value={ambiente}>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Ref.</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Dimensões</TableHead>
                                <TableHead>Qtd</TableHead>
                                <TableHead>Custo Unit.</TableHead>
                                <TableHead>Custo Total</TableHead>
                                <TableHead>Preço Unit.</TableHead>
                                <TableHead>Preço Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {items.map((item: any) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-mono text-xs">
                                    {item.referencia}
                                  </TableCell>
                                  <TableCell>{item.descricao}</TableCell>
                                  <TableCell>
                                    <Badge variant={item.tipo_item === 'chapa' ? 'default' : 'secondary'}>
                                      {item.tipo_item}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {item.largura_mm && item.altura_mm ? (
                                      <>
                                        {item.largura_mm}×{item.altura_mm}
                                        {item.profundidade_mm && `×${item.profundidade_mm}`}
                                      </>
                                    ) : '-'}
                                  </TableCell>
                                  <TableCell>{item.quantidade}</TableCell>
                                  <TableCell>
                                    {item.sem_preco ? (
                                      <Badge variant="destructive" className="text-xs">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Sem preço
                                      </Badge>
                                    ) : (
                                      formatCurrency(item.custo_unitario)
                                    )}
                                  </TableCell>
                                  <TableCell>{formatCurrency(item.custo_total)}</TableCell>
                                  <TableCell>{formatCurrency(item.preco_unitario)}</TableCell>
                                  <TableCell className="font-bold">
                                    {formatCurrency(item.preco_total)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>

                          <div className="mt-4 flex justify-end gap-8 text-sm">
                            <div>
                              <span className="text-muted-foreground">Custo Total ({ambiente}):</span>
                              <span className="ml-2 font-bold">
                                {formatCurrency(
                                  items.reduce((sum: number, item: any) => sum + (item.custo_total || 0), 0)
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Preço Total ({ambiente}):</span>
                              <span className="ml-2 font-bold text-primary">
                                {formatCurrency(
                                  items.reduce((sum: number, item: any) => sum + (item.preco_total || 0), 0)
                                )}
                              </span>
                            </div>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>

                    {budget.observacoes && (
                      <div className="mt-6 p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Observações</h4>
                        <p className="text-sm text-muted-foreground">{budget.observacoes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orcamentos;