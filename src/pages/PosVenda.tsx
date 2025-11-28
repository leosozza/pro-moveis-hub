import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Loader2 } from "lucide-react";

const PosVenda = () => {
  const [selectedDeal, setSelectedDeal] = useState<any>(null);

  const { data: pipeline } = useQuery({
    queryKey: ["pos_venda_pipeline"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipelines")
        .select("*, stages(*)")
        .eq("type", "pos_venda")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: deals, isLoading } = useQuery({
    queryKey: ["pos_venda_deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          customers:customer_id(name),
          projects:project_id(name),
          profiles:responsible_id(full_name)
        `)
        .eq("pipeline_id", pipeline?.id)
        .order("position");
      if (error) throw error;
      return data;
    },
    enabled: !!pipeline?.id,
  });

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
        <h1 className="text-3xl font-bold mb-2">Pós-Venda</h1>
        <p className="text-muted-foreground">
          Acompanhe a execução dos projetos vendidos
        </p>
      </div>

      {pipeline && (
        <KanbanBoard
          stages={pipeline.stages || []}
          cards={deals || []}
          onCardClick={setSelectedDeal}
          onAddCard={() => {}}
          tableName="deals"
        />
      )}
    </div>
  );
};

export default PosVenda;