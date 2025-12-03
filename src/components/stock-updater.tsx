'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Product, StockLocation, Inventory, ProductStock } from '@/lib/data';
import { updateProductStock } from '@/lib/storage';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { Warehouse, Store, Car, Truck, Home, ShoppingBasket } from 'lucide-react';
import { InventoryIcon } from './inventory-icon';
import { cn } from '@/lib/utils';

type StockUpdaterProps = {
  product: Product;
  inventory: Inventory;
  stock: ProductStock;
};

const locationIcons: Record<string, React.ReactNode> = {
  depo: <Warehouse className="h-5 w-5" />,
  dükkan: <Store className="h-5 w-5" />,
  araç: <Car className="h-5 w-5" />,
  kamyon: <Truck className="h-5 w-5" />,
  ev: <Home className="h-5 w-5" />,
  sepet: <ShoppingBasket className="h-5 w-5" />,
  default: <Package className="h-5 w-5" />,
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

export default function StockUpdater({ product, inventory, stock: initialStock }: StockUpdaterProps) {
  const [stock, setStock] = useState(initialStock.stockByLocation);
  const hasImage = product.image.imageUrl && product.image.imageUrl.startsWith('http');
  const hasDataUrl = product.image.imageUrl && product.image.imageUrl.startsWith('data:');

  // When the initialStock prop changes, update the state
  useEffect(() => {
    setStock(initialStock.stockByLocation);
  }, [initialStock]);

  const handleStockChange = (locationId: string, amount: number) => {
    const newStockCount = (stock[locationId] || 0) + amount;
    
    if (newStockCount < 0) {
      toast({
          title: "Stok Sıfır",
          description: `${inventory.locations.find(l=>l.id === locationId)?.name} stok adedi zaten sıfır.`,
          variant: "destructive"
      });
      return;
    }
    
    const updatedStock = { ...stock, [locationId]: newStockCount };
    setStock(updatedStock);
    updateProductStock(inventory.id, product.id, locationId, newStockCount);
  };

  const totalStock = Object.values(stock).reduce((sum, val) => sum + val, 0);

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <Card className="overflow-hidden">
        <div className={cn("aspect-video w-full overflow-hidden", !hasImage && !hasDataUrl && "icon-card-background")}>
           {hasImage || hasDataUrl ? (
                <Image
                    src={product.image.imageUrl}
                    alt={product.image.description}
                    width={800}
                    height={450}
                    className="h-full w-full object-cover"
                    data-ai-hint={product.image.imageHint}
                    priority
                />
           ) : (
                <InventoryIcon iconId={product.image.iconId!} className="h-40 w-40 text-muted-foreground/60" />
           )}
        </div>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <CardTitle className="text-3xl font-bold">{product.name}</CardTitle>
            <Badge variant="secondary" className="w-fit text-base font-mono tracking-wider">{product.code}</Badge>
          </div>
          <CardDescription className="pt-2 text-lg">
            Toplam Stok: <span className="font-bold text-foreground">{totalStock}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <h3 className="text-lg font-semibold">Lokasyon Bazlı Stok Durumu</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {inventory.locations.map((loc) => (
              <Card key={loc.id}>
                <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
                  {getLocationIcon(loc.name)}
                  <CardTitle className="text-md">{loc.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-4xl font-bold">{stock[loc.id] || 0}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-12 w-12 rounded-full"
                      onClick={() => handleStockChange(loc.id, -1)}
                      aria-label={`${loc.name} stok eksilt`}
                    >
                      <Minus className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => handleStockChange(loc.id, 1)}
                       aria-label={`${loc.name} stok arttır`}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
