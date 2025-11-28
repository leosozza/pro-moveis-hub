import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, CheckCircle2, AlertCircle, Wrench, Package } from "lucide-react";

const Dashboard = () => {
  // Vendas
  const { data: salesStats } = useQuery({
    queryKey: ["sales_stats"],
    queryFn: async () => {
      const { data: pipeline } = await supabase
        .from("pipelines")
        .select("id")
        .eq("type", "vendas")
        .single();

      const { data: deals } = await supabase
        .from("deals")
        .select("status, estimated_value, final_value")
        .eq("pipeline_id", pipeline?.id);

      const totalLeads = deals?.length || 0;
      const wonDeals = deals?.filter(d => d.status === "ganho").length || 0;
      const totalValue = deals?.reduce((sum, d) => sum + (d.final_value || d.estimated_value || 0), 0) || 0;
      const conversionRate = totalLeads > 0 ? (wonDeals / totalLeads * 100).toFixed(1) : "0";

      return { totalLeads, wonDeals, totalValue, conversionRate };
    },
  });

  // Pós-venda
  const { data: posVendaStats } = useQuery({
    queryKey: ["pos_venda_stats"],
    queryFn: async () => {
      const { data: pipeline } = await supabase
        .from("pipelines")
        .select("id, stages(*)")
        .eq("type", "pos_venda")
        .single();

      const { data: deals } = await supabase
        .from("deals")
        .select("stage_id")
        .eq("pipeline_id", pipeline?.id);

      const stagesCount = pipeline?.stages?.map(stage => ({
        name: stage.name,
        count: deals?.filter(d => d.stage_id === stage.id).length || 0,
      })) || [];

      return { stagesCount };
    },
  });

  // Montagens
  const { data: assemblyStats } = useQuery({
    queryKey: ["assembly_stats"],
    queryFn: async () => {
      const { data: orders } = await supabase
        .from("assembly_orders")
        .select("status");

      const agendadas = orders?.filter(o => o.status === "agendada").length || 0;
      const emAndamento = orders?.filter(o => o.status === "em_andamento").length || 0;
      const concluidas = orders?.filter(o => o.status === "concluida").length || 0;

      return { agendadas, emAndamento, concluidas };
    },
  });

  // Assistência
  const { data: supportStats } = useQuery({
    queryKey: ["support_stats"],
    queryFn: async () => {
      const { data: pipeline } = await supabase
        .from("pipelines")
        .select("id, stages(*)")
        .eq("type", "assistencia")
        .single();

      const { data: tickets } = await supabase
        .from("service_tickets")
        .select("stage_id, priority")
        .eq("pipeline_id", pipeline?.id);

      const finalizadoStage = pipeline?.stages?.find(s => s.position === 5);
      const abertos = tickets?.filter(t => t.stage_id !== finalizadoStage?.id).length || 0;
      const fechados = tickets?.filter(t => t.stage_id === finalizadoStage?.id).length || 0;
      const urgentes = tickets?.filter(t => t.priority === "urgente").length || 0;

      return { abertos, fechados, urgentes };
    },
  });

  // Projetos
  const { data: projectStats } = useQuery({
    queryKey: ["project_stats"],
    queryFn: async () => {
      const { data: budgets } = await supabase
        .from("budgets")
        .select("total_custo, total_preco");

      const totalCusto = budgets?.reduce((sum, b) => sum + (b.total_custo || 0), 0) || 0;
      const totalPreco = budgets?.reduce((sum, b) => sum + (b.total_preco || 0), 0) || 0;
      const lucro = totalPreco - totalCusto;
      const margemMedia = totalPreco > 0 ? ((lucro / totalPreco) * 100).toFixed(1) : "0";

      return { totalCusto, totalPreco, lucro, margemMedia };
    },
  });

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      {/* Vendas */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Vendas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total de Leads</CardDescription>
              <CardTitle className="text-3xl">{salesStats?.totalLeads || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Taxa de Conversão</CardDescription>
              <CardTitle className="text-3xl text-green-600">{salesStats?.conversionRate}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Deals Ganhos</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                {salesStats?.wonDeals || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Valor Total</CardDescription>
              <CardTitle className="text-2xl text-primary">
                R$ {(salesStats?.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Pós-Venda */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Pós-Venda
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {posVendaStats?.stagesCount.map((stage, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">{stage.name}</CardDescription>
                <CardTitle className="text-2xl">{stage.count}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Montagens */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Montagens
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Agendadas</CardDescription>
              <CardTitle className="text-3xl">{assemblyStats?.agendadas || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Em Andamento</CardDescription>
              <CardTitle className="text-3xl text-blue-600">{assemblyStats?.emAndamento || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Concluídas</CardDescription>
              <CardTitle className="text-3xl text-green-600">{assemblyStats?.concluidas || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Assistência Técnica */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Assistência Técnica
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Chamados Abertos</CardDescription>
              <CardTitle className="text-3xl">{supportStats?.abertos || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Urgentes</CardDescription>
              <CardTitle className="text-3xl text-red-600">{supportStats?.urgentes || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Finalizados</CardDescription>
              <CardTitle className="text-3xl text-green-600">{supportStats?.fechados || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Projetos e Lucro */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Projetos e Lucratividade
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Custo Total</CardDescription>
              <CardTitle className="text-2xl">
                R$ {(projectStats?.totalCusto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Preço Total</CardDescription>
              <CardTitle className="text-2xl text-primary">
                R$ {(projectStats?.totalPreco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Lucro</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                R$ {(projectStats?.lucro || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Margem Média</CardDescription>
              <CardTitle className="text-3xl text-green-600">{projectStats?.margemMedia}%</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;