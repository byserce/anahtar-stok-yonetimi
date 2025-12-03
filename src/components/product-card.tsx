'use client';
import Link from 'next/link';
import Image from 'next/image';
import type { Product, Inventory, ProductStock, Location } from '@/lib/data';
import { getTotalStock } from '@/lib/storage';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Warehouse, Store, Car, Truck, Home, ShoppingBasket, Package } from 'lucide-react';
import { Separator } from './ui/separator';
import { InventoryIcon } from './inventory-icon';

type ProductCardProps = {
  product: Product;
  inventory: Inventory;
  stock: ProductStock;
};

const locationIcons: Record<string, React.ReactNode> = {
  depo: <Warehouse className="h-3 w-3" />,
  dükkan: <Store className="h-3 w-3" />,
  araç: <Car className="h-3 w-3" />,
  kamyon: <Truck className="h-3 w-3" />,
  ev: <Home className="h-3 w-3" />,
  sepet: <ShoppingBasket className="h-3 w-3" />,
  default: <Package className="h-3 w-3" />,
};

const getLocationIcon = (locationName: string) => {
    const name = locationName.toLowerCase();
    for (const key in locationIcons) {
        if (name.includes(key)) {
            return locationIcons[key];
        }
    }
    return locationIcons.default;
}

export default function ProductCard({ product, inventory, stock }: ProductCardProps) {
  const totalStock = getTotalStock(stock, inventory.locations);
  const criticalThreshold = inventory.criticalThresholds[product.id] || 0;
  const isCritical = totalStock <= criticalThreshold;
  const hasImage = product.image.imageUrl && product.image.imageUrl.startsWith('http');
  const hasDataUrl = product.image.imageUrl && product.image.imageUrl.startsWith('data:');

  return (
    <Link href={`/inventories/${inventory.id}/product/${product.id}`} className="group flex flex-col">
      <Card
        className={cn(
          'flex h-full flex-col overflow-hidden transition-all duration-300 group-hover:shadow-lg',
          isCritical && 'border-destructive/50 ring-2 ring-destructive/20'
        )}
      >
        <CardHeader className="relative p-0">
          <div className={cn("aspect-video overflow-hidden", !hasImage && !hasDataUrl && "icon-card-background")}>
            {hasImage || hasDataUrl ? (
                <Image
                src={product.image.imageUrl}
                alt={product.image.description}
                width={400}
                height={300}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={product.image.imageHint}
                />
            ) : (
                <InventoryIcon iconId={product.image.iconId!} className="h-20 w-20 text-muted-foreground/60 transition-transform duration-300 group-hover:scale-110" />
            )}
          </div>
          {isCritical && (
            <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-destructive/90 px-2 py-1 text-[10px] font-bold text-destructive-foreground">
              <AlertTriangle className="h-3 w-3" />
              <span>Kritik</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 p-3">
          <CardTitle className="mb-1.5 text-sm font-semibold leading-tight group-hover:text-primary">
            {product.name}
          </CardTitle>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Toplam Stok:</span>
            <Badge variant={isCritical ? 'destructive' : 'secondary'} className="text-sm font-bold">
              {totalStock}
            </Badge>
          </div>
        </CardContent>
         <CardFooter className="flex flex-col items-start gap-2 p-3 pt-0 text-xs">
           <Separator className="mb-2" />
            <div className="grid w-full grid-cols-3 gap-2 text-center">
              {inventory.locations.map((loc) => (
                <div key={loc.id} className="flex flex-col items-center gap-0.5 rounded-md bg-muted/50 p-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    {getLocationIcon(loc.name)}
                    <span className="text-[10px] font-medium truncate">{loc.name}</span>
                  </div>
                  <span className="font-bold text-foreground">{stock.stockByLocation[loc.id] || 0}</span>
                </div>
              ))}
            </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
