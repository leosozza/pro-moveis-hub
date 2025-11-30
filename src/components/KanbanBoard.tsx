import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GripVertical, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Exported types for reuse
export interface KanbanStage {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface KanbanCard {
  id: string;
  title: string;
  stage_id: string;
  description?: string | null;
  priority?: 'baixa' | 'media' | 'alta' | 'urgente';
  customers?: { name: string } | null;
  projects?: { name: string } | null;
  estimated_value?: number | null;
  [key: string]: unknown;
}

interface KanbanBoardProps {
  stages: KanbanStage[];
  cards: KanbanCard[];
  onCardClick?: (card: KanbanCard) => void;
  onCardMove: (cardId: string, newStageId: string) => Promise<void>;
  onAddCard?: (stageId: string) => void;
  isMoving?: boolean;
  renderCardContent?: (card: KanbanCard) => React.ReactNode;
  className?: string;
}

export const KanbanBoard = ({
  stages,
  cards,
  onCardClick,
  onCardMove,
  onAddCard,
  isMoving = false,
  renderCardContent,
  className,
}: KanbanBoardProps) => {
  const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null);
  const [isMovingCard, setIsMovingCard] = useState(false);

  const handleDragStart = (card: KanbanCard) => {
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (stageId: string) => {
    if (!draggedCard || draggedCard.stage_id === stageId) {
      setDraggedCard(null);
      return;
    }

    setIsMovingCard(true);
    try {
      await onCardMove(draggedCard.id, stageId);
    } finally {
      setIsMovingCard(false);
      setDraggedCard(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPriorityVariant = (priority?: string): "destructive" | "default" | "secondary" | "outline" => {
    switch (priority) {
      case 'urgente': return 'destructive';
      case 'alta': return 'default';
      case 'media': return 'secondary';
      case 'baixa': return 'outline';
      default: return 'secondary';
    }
  };

  const renderDefaultCardContent = (card: KanbanCard) => {
    return (
      <>
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
          {card.customers?.name && (
            <div className="text-xs text-muted-foreground">
              👤 {card.customers.name}
            </div>
          )}
          {card.projects?.name && (
            <div className="text-xs text-muted-foreground">
              📁 {card.projects.name}
            </div>
          )}
          {card.estimated_value && (
            <div className="text-xs font-medium text-primary">
              {formatCurrency(card.estimated_value)}
            </div>
          )}
          {card.priority && (
            <Badge variant={getPriorityVariant(card.priority)} className="text-xs">
              {card.priority}
            </Badge>
          )}
        </CardContent>
      </>
    );
  };

  const renderCard = (card: KanbanCard) => {
    if (renderCardContent) {
      return renderCardContent(card);
    }
    return renderDefaultCardContent(card);
  };

  return (
    <div className={cn("flex gap-4 overflow-x-auto pb-4", className)}>
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
                  <div className="space-y-2 pr-4">
                    {stageCards.map((card) => (
                      <Card
                        key={card.id}
                        className={cn(
                          "cursor-move hover:shadow-md transition-shadow",
                          draggedCard?.id === card.id && "opacity-50",
                          (isMovingCard || isMoving) && "pointer-events-none"
                        )}
                        draggable={!isMoving && !isMovingCard}
                        onDragStart={() => handleDragStart(card)}
                        onClick={() => onCardClick?.(card)}
                      >
                        {renderCard(card)}
                      </Card>
                    ))}
                    {onAddCard && (
                      <Button
                        variant="ghost"
                        className="w-full border-2 border-dashed"
                        onClick={() => onAddCard(stage.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    )}
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