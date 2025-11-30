import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GripVertical, Plus } from "lucide-react";

interface Stage {
  id: string;
  name: string;
  position: number;
  color: string;
}

interface KanbanCard {
  id: string;
  title: string;
  description?: string | null;
  stage_id: string;
  position: number;
  customers?: { name: string } | null;
  estimated_value?: number | null;
  priority?: string;
  customer_name?: string | null;
}

interface KanbanBoardProps {
  stages: Stage[];
  cards: KanbanCard[];
  onCardClick: (card: KanbanCard) => void;
  onAddCard: (stageId: string) => void;
  onCardMove?: (cardId: string, newStageId: string) => Promise<void>;
}

export const KanbanBoard = ({ stages, cards, onCardClick, onAddCard, onCardMove }: KanbanBoardProps) => {
  const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const handleDragStart = (card: KanbanCard) => {
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stageId: string) => {
    if (draggedCard && draggedCard.stage_id !== stageId && onCardMove && !isMoving) {
      setIsMoving(true);
      try {
        await onCardMove(draggedCard.id, stageId);
      } finally {
        setIsMoving(false);
      }
    }
    setDraggedCard(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPriorityColor = (priority?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case 'urgente': return 'destructive';
      case 'alta': return 'default';
      case 'media': return 'secondary';
      case 'baixa': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageCards = cards.filter((card) => card.stage_id === stage.id);
        
        return (
          <div
            key={stage.id}
            className="min-w-[320px] flex-shrink-0"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(stage.id)}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <CardTitle className="text-sm font-medium">
                      {stage.name}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary">{stageCards.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-2">
                    {stageCards.map((card) => (
                      <Card
                        key={card.id}
                        className="cursor-move hover:shadow-md transition-shadow"
                        draggable
                        onDragStart={() => handleDragStart(card)}
                        onClick={() => onCardClick(card)}
                      >
                        <CardHeader className="p-3 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-sm font-medium line-clamp-2">
                              {card.title}
                            </CardTitle>
                            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                          {card.description && (
                            <CardDescription className="text-xs line-clamp-2">
                              {card.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-2">
                          {card.customers && (
                            <div className="text-xs text-muted-foreground">
                              👤 {card.customers.name}
                            </div>
                          )}
                          {card.estimated_value && (
                            <div className="text-xs font-medium text-primary">
                              {formatCurrency(card.estimated_value)}
                            </div>
                          )}
                          {card.priority && (
                            <Badge variant={getPriorityColor(card.priority)} className="text-xs">
                              {card.priority}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    <Button
                      variant="ghost"
                      className="w-full border-2 border-dashed"
                      onClick={() => onAddCard(stage.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
};