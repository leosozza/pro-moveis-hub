import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Loader2, DollarSign, Upload } from "lucide-react";
import { PipelineConfig } from "@/components/PipelineConfig";
import { PipelineTunnelConfig } from "@/components/PipelineTunnelConfig";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Configuracoes = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("company");
  const [openNewPriceTable, setOpenNewPriceTable] = useState(false);
  const [openNewSheet, setOpenNewSheet] = useState(false);
  const [openNewHardware, setOpenNewHardware] = useState(false);
  const [openNewMargin, setOpenNewMargin] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>("");

  // Dados da empresa
  const { data: company } = useQuery({
    queryKey: ["company"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();
      
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", profile?.company_id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Tabelas de preço
  const { data: priceTables } = useQuery({
    queryKey: ["price_tables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_tables")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Preços de chapas
  const { data: sheetPrices } = useQuery({
    queryKey: ["sheet_prices", selectedTable],
    queryFn: async () => {
      if (!selectedTable) return [];
      const { data, error } = await supabase
        .from("sheet_prices")
        .select("*")
        .eq("price_table_id", selectedTable)
        .order("material");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTable,
  });

  // Preços de ferragens
  const { data: hardwarePrices } = useQuery({
    queryKey: ["hardware_prices", selectedTable],
    queryFn: async () => {
      if (!selectedTable) return [];
      const { data, error } = await supabase
        .from("hardware_prices")
        .select("*")
        .eq("price_table_id", selectedTable)
        .order("referencia");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTable,
  });

  // Regras de margem
  const { data: marginRules } = useQuery({
    queryKey: ["margin_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("margin_rules")
        .select("*")
        .order("tipo_item");
      if (error) throw error;
      return data;
    },
  });

  // Mutations
  const updateCompany = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("companies")
        .update(data)
        .eq("id", company?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
      toast.success("Configurações atualizadas!");
    },
  });

  const createPriceTable = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from("price_tables")
        .insert([{ name, company_id: company?.id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price_tables"] });
      toast.success("Tabela criada!");
      setOpenNewPriceTable(false);
    },
  });

  const createSheetPrice = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("sheet_prices")
        .insert([{ ...data, price_table_id: selectedTable }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sheet_prices"] });
      toast.success("Preço de chapa adicionado!");
      setOpenNewSheet(false);
    },
  });

  const createHardwarePrice = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("hardware_prices")
        .insert([{ ...data, price_table_id: selectedTable }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hardware_prices"] });
      toast.success("Preço de ferragem adicionado!");
      setOpenNewHardware(false);
    },
  });

  const createMarginRule = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("margin_rules")
        .insert([{ ...data, company_id: company?.id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["margin_rules"] });
      toast.success("Regra de margem adicionada!");
      setOpenNewMargin(false);
    },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">Configure preços, margens e dados da empresa</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="company">Empresa</TabsTrigger>
          <TabsTrigger value="prices">Tabelas de Preço</TabsTrigger>
          <TabsTrigger value="margins">Regras de Margem</TabsTrigger>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="tunnels">Túneis</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logotipo da Empresa</CardTitle>
              <CardDescription>Personalize seu CRM com o logo da sua marcenaria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {company?.logo_url && (
                  <img src={company.logo_url} alt="Logo" className="h-16 w-auto object-contain" />
                )}
                <div>
                  <Label htmlFor="logo-upload">Upload de Logo</Label>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      const fileExt = file.name.split('.').pop();
                      const fileName = `logos/${company?.id}.${fileExt}`;
                      
                      const { error: uploadError } = await supabase.storage
                        .from('project-files')
                        .upload(fileName, file, { upsert: true });
                      
                      if (uploadError) {
                        toast.error("Erro ao enviar logo");
                        return;
                      }
                      
                      const { data: { publicUrl } } = supabase.storage
                        .from('project-files')
                        .getPublicUrl(fileName);
                      
                      updateCompany.mutate({ logo_url: publicUrl });
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações da Empresa</CardTitle>
              <CardDescription>Margens padrão e percentual de perda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Margem Padrão - Chapas (%)</Label>
                  <Input
                    type="number"
                    value={company?.margem_padrao_chapa || 40}
                    onChange={(e) => updateCompany.mutate({ margem_padrao_chapa: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Margem Padrão - Ferragens (%)</Label>
                  <Input
                    type="number"
                    value={company?.margem_padrao_ferragem || 30}
                    onChange={(e) => updateCompany.mutate({ margem_padrao_ferragem: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Perda de Chapa (%)</Label>
                  <Input
                    type="number"
                    value={company?.perda_chapa_percentual || 10}
                    onChange={(e) => updateCompany.mutate({ perda_chapa_percentual: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prices" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Selecione uma tabela" />
                </SelectTrigger>
                <SelectContent>
                  {priceTables?.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setOpenNewPriceTable(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Tabela
            </Button>
          </div>

          {selectedTable && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Preços de Chapas</CardTitle>
                      <CardDescription>Material, espessura e preço por m²</CardDescription>
                    </div>
                    <Button onClick={() => setOpenNewSheet(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Chapa
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Espessura</TableHead>
                        <TableHead>Preço/m²</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sheetPrices?.map((price) => (
                        <TableRow key={price.id}>
                          <TableCell>{price.material}</TableCell>
                          <TableCell>{price.marca}</TableCell>
                          <TableCell>{price.espessura}</TableCell>
                          <TableCell>R$ {price.preco_m2.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Preços de Ferragens</CardTitle>
                      <CardDescription>Referência e preço unitário</CardDescription>
                    </div>
                    <Button onClick={() => setOpenNewHardware(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Ferragem
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Referência</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Preço Unitário</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hardwarePrices?.map((price) => (
                        <TableRow key={price.id}>
                          <TableCell>{price.referencia}</TableCell>
                          <TableCell>{price.descricao}</TableCell>
                          <TableCell>R$ {price.preco_unitario.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="margins" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Regras de Margem</CardTitle>
                  <CardDescription>Configure margens por tipo de item, cliente e ambiente</CardDescription>
                </div>
                <Button onClick={() => setOpenNewMargin(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Regra
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo Item</TableHead>
                    <TableHead>Tipo Cliente</TableHead>
                    <TableHead>Ambiente</TableHead>
                    <TableHead>Margem (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marginRules?.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="capitalize">{rule.tipo_item}</TableCell>
                      <TableCell>{rule.tipo_cliente || "Todos"}</TableCell>
                      <TableCell>{rule.ambiente || "Todos"}</TableCell>
                      <TableCell>{rule.margem_percentual}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipelines">
          <PipelineConfig />
        </TabsContent>

        <TabsContent value="tunnels">
          <PipelineTunnelConfig />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={openNewPriceTable} onOpenChange={setOpenNewPriceTable}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Tabela de Preços</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            createPriceTable.mutate(formData.get("name") as string);
          }}>
            <div className="space-y-4">
              <div>
                <Label>Nome da Tabela</Label>
                <Input name="name" required />
              </div>
              <Button type="submit" className="w-full">Criar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openNewSheet} onOpenChange={setOpenNewSheet}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Preço de Chapa</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            createSheetPrice.mutate({
              material: formData.get("material"),
              marca: formData.get("marca"),
              espessura: formData.get("espessura"),
              preco_m2: parseFloat(formData.get("preco_m2") as string),
            });
          }}>
            <div className="space-y-4">
              <div>
                <Label>Material</Label>
                <Input name="material" required />
              </div>
              <div>
                <Label>Marca</Label>
                <Input name="marca" />
              </div>
              <div>
                <Label>Espessura</Label>
                <Input name="espessura" required />
              </div>
              <div>
                <Label>Preço por m²</Label>
                <Input name="preco_m2" type="number" step="0.01" required />
              </div>
              <Button type="submit" className="w-full">Adicionar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openNewHardware} onOpenChange={setOpenNewHardware}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Preço de Ferragem</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            createHardwarePrice.mutate({
              referencia: formData.get("referencia"),
              descricao: formData.get("descricao"),
              preco_unitario: parseFloat(formData.get("preco_unitario") as string),
            });
          }}>
            <div className="space-y-4">
              <div>
                <Label>Referência</Label>
                <Input name="referencia" required />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input name="descricao" />
              </div>
              <div>
                <Label>Preço Unitário</Label>
                <Input name="preco_unitario" type="number" step="0.01" required />
              </div>
              <Button type="submit" className="w-full">Adicionar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openNewMargin} onOpenChange={setOpenNewMargin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Regra de Margem</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            createMarginRule.mutate({
              tipo_item: formData.get("tipo_item"),
              tipo_cliente: formData.get("tipo_cliente") || null,
              ambiente: formData.get("ambiente") || null,
              margem_percentual: parseFloat(formData.get("margem_percentual") as string),
            });
          }}>
            <div className="space-y-4">
              <div>
                <Label>Tipo de Item</Label>
                <Select name="tipo_item" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chapa">Chapa</SelectItem>
                    <SelectItem value="ferragem">Ferragem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Cliente (opcional)</Label>
                <Input name="tipo_cliente" />
              </div>
              <div>
                <Label>Ambiente (opcional)</Label>
                <Input name="ambiente" />
              </div>
              <div>
                <Label>Margem (%)</Label>
                <Input name="margem_percentual" type="number" step="0.01" required />
              </div>
              <Button type="submit" className="w-full">Adicionar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Configuracoes;