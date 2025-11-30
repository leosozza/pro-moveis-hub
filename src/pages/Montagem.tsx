import { useState } from "react";
import { useAssemblyOrders } from "@/modules/assembly/hooks/useAssemblyOrders";
import { useUpdateOrderStatus } from "@/modules/assembly/hooks/useUpdateOrderStatus";
import { useCreateInspection } from "@/modules/assembly/hooks/useCreateInspection";
import type { AssemblyOrder, AssemblyStatus } from "@/modules/assembly/types/assembly.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Wrench, CheckCircle2, Clock, Loader2, Upload, FileText } from "lucide-react";
import { format } from "date-fns";

const Montagem = () => {
  const [selectedOrder, setSelectedOrder] = useState<AssemblyOrder | null>(null);
  const [openInspection, setOpenInspection] = useState(false);
  const [inspectionData, setInspectionData] = useState({
    customer_name: "",
    approved: false,
    observations: "",
  });

  const { orders: assemblyOrders, isLoading } = useAssemblyOrders();
  const { updateStatus } = useUpdateOrderStatus();
  const { createInspection, isLoading: isCreatingInspection } = useCreateInspection();

  const handleInspectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    
    await createInspection({
      ...inspectionData,
      assembly_order_id: selectedOrder.id,
    });
    
    setOpenInspection(false);
    setSelectedOrder(null);
    setInspectionData({
      customer_name: "",
      approved: false,
      observations: "",
    });
  };

  const handleStatusUpdate = async (orderId: string, status: AssemblyStatus) => {
    await updateStatus(orderId, status);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "secondary" | "default" | "outline"; icon: typeof Clock }> = {
      agendada: { label: "Agendada", variant: "secondary", icon: Clock },
      em_andamento: { label: "Em Andamento", variant: "default", icon: Wrench },
      concluida: { label: "Concluída", variant: "outline", icon: CheckCircle2 },
    };
    const config = statusMap[status] || statusMap.agendada;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
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
        <h1 className="text-3xl font-bold mb-2">Área do Montador</h1>
        <p className="text-muted-foreground">Gerencie suas montagens e vistorias</p>
      </div>

      <div className="grid gap-6">
        {assemblyOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{order.projects?.name}</CardTitle>
                  <CardDescription>
                    {order.deals?.title && `Deal: ${order.deals.title} • `}
                    Montador: {order.profiles?.full_name || "Não atribuído"}
                  </CardDescription>
                </div>
                {getStatusBadge(order.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {order.scheduled_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(order.scheduled_date), "dd/MM/yyyy HH:mm")}</span>
                  </div>
                )}
                {order.assembly_value && (
                  <div className="font-medium text-primary">
                    Valor: R$ {order.assembly_value.toFixed(2)}
                  </div>
                )}
              </div>

              {order.material_request && (
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Solicitação de Material</h4>
                  <p className="text-sm text-muted-foreground">{order.material_request}</p>
                </div>
              )}

              {order.observations && (
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Observações</h4>
                  <p className="text-sm text-muted-foreground">{order.observations}</p>
                </div>
              )}

              <div className="flex gap-2">
                {order.status === "agendada" && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate(order.id, "em_andamento")}
                  >
                    Iniciar Montagem
                  </Button>
                )}
                {order.status === "em_andamento" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setOpenInspection(true);
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Registrar Vistoria
                    </Button>
                    <Button size="sm" variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Enviar Fotos
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {assemblyOrders.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">Nenhuma montagem agendada</CardTitle>
              <CardDescription>
                Suas montagens aparecerão aqui quando forem agendadas
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={openInspection} onOpenChange={setOpenInspection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Vistoria Final</DialogTitle>
            <DialogDescription>
              Preencha os dados da vistoria e aprovação do cliente
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInspectionSubmit} className="space-y-4">
            <div>
              <Label>Nome do Cliente *</Label>
              <Input
                value={inspectionData.customer_name}
                onChange={(e) => setInspectionData({ ...inspectionData, customer_name: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="approved"
                checked={inspectionData.approved}
                onCheckedChange={(checked) => 
                  setInspectionData({ ...inspectionData, approved: checked as boolean })
                }
              />
              <Label htmlFor="approved" className="cursor-pointer">
                Cliente aprovou a montagem
              </Label>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={inspectionData.observations}
                onChange={(e) => setInspectionData({ ...inspectionData, observations: e.target.value })}
                rows={3}
                placeholder="Detalhes da vistoria, pendências, etc."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenInspection(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreatingInspection}>
                {isCreatingInspection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Montagem;