'use client';
import Image from 'next/image';
import type { Product, Inventory, ProductStock } from '@/lib/data';
import { getTotalStock } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from './ui/button';
import { InventoryIcon } from './inventory-icon';
import { useTranslation } from '@/context/translation-context';

type SortableProductCardProps = {
  product: Product;
  inventory: Inventory;
  stock: ProductStock;
  onMove: (productId: string, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
};

export function SortableProductCard({ product, inventory, stock, onMove, isFirst, isLast }: SortableProductCardProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    // We only apply dnd-kit transforms during dragging
    transform: isDragging ? CSS.Transform.toString(transform) : undefined,
    transition: isDragging ? (transition || 'transform 250ms ease') : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  const totalStock = getTotalStock(stock, inventory.locations);
  const criticalThreshold = inventory.criticalThresholds[product.id] || 0;
  const isCritical = totalStock <= criticalThreshold;
  const hasImage = product.image.imageUrl && product.image.imageUrl.startsWith('http');
  const hasDataUrl = product.image.imageUrl && product.image.imageUrl.startsWith('data:');

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={cn(
          'overflow-hidden transition-shadow duration-300',
          isCritical && 'border-destructive/50',
          isDragging && 'shadow-2xl ring-2 ring-primary'
        )}
      >
        <div className="flex items-center p-2">
            <Button variant="ghost" size="icon" className="cursor-grab touch-none" {...listeners}>
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </Button>
            <div className={cn("relative h-16 w-16 overflow-hidden rounded-md", !hasImage && !hasDataUrl && "icon-card-background")}>
                {hasImage || hasDataUrl ? (
                    <Image
                        src={product.image.imageUrl}
                        alt={product.image.description}
                        fill
                        className="object-cover"
                        data-ai-hint={product.image.imageHint}
                    />
                ) : (
                    <InventoryIcon iconId={product.image.iconId!} className="h-full w-full p-3 text-muted-foreground/60" />
                )}
            </div>
            <div className="flex-1 pl-3">
                 <p className="text-sm font-semibold leading-tight">
                    {product.name}
                </p>
                 <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span>{t('total_stock')}:</span>
                    <Badge variant={isCritical ? 'destructive' : 'secondary'} className="text-sm font-bold">
                    {totalStock}
                    </Badge>
                </div>
            </div>
             <div className="flex flex-col gap-1 pr-1">
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={() => onMove(product.id, 'up')}
                    disabled={isFirst}
                    aria-label={t('move_up')}
                >
                    <ArrowUp className="h-4 w-4" />
                </Button>
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={() => onMove(product.id, 'down')}
                    disabled={isLast}
                    aria-label={t('move_down')}
                >
                    <ArrowDown className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </Card>
    </div>
  );
}
