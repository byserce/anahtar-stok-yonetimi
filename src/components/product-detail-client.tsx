'use client';

import { notFound, useRouter } from 'next/navigation';
import { getProductWithStock, deleteProductFromInventory } from '@/lib/storage';
import StockUpdater from '@/components/stock-updater';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useEffect, useState } from 'react';
import type { Product, Inventory, ProductStock } from '@/lib/data';
import ProductEditForm from './product-edit-form';
import { toast } from '@/hooks/use-toast';


type FullProductInfo = {
    product: Product;
    stock: ProductStock;
    inventory: Inventory;
};

export default function ProductDetailClient({ inventoryId, productId }: { inventoryId: string, productId: string }) {
  const router = useRouter();
  const [data, setData] = useState<FullProductInfo | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    const foundData = getProductWithStock(inventoryId, productId);
    setData(foundData);
    setLoading(false);
  }, [inventoryId, productId]);
  
  const handleProductUpdate = (updatedProduct: Product) => {
    if(data) {
        const newData = { ...data, product: updatedProduct };
        setData(newData);
        router.refresh();
    }
  }

  const handleProductDelete = () => {
    if (data) {
        deleteProductFromInventory(data.inventory.id, data.product.id);
        toast({
            title: "Ürün Silindi",
            description: `${data.product.name} envanterden kalıcı olarak silindi.`,
        });
        router.push(`/inventories/${data.inventory.id}`);
        router.refresh();
    }
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
           <Skeleton className="h-8 w-8 rounded-full" />
           <Skeleton className="h-6 w-48" />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="mx-auto max-w-4xl">
                 <Skeleton className="aspect-video w-full" />
                 <div className="mt-4 space-y-2">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-1/4" />
                 </div>
            </div>
        </main>
      </div>
    );
  }

  if (!data) {
    notFound();
  }
  
  const { product, stock, inventory } = data;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/inventories/${inventory.id}`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Geri</span>
            </Link>
          </Button>
           <h1 className="truncate text-xl font-semibold">{product.name}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Düzenle
        </Button>
      </header>
      <main className="flex-1 overflow-auto">
        <StockUpdater product={product} stock={stock} inventory={inventory} />
      </main>
      
      {product && (
        <ProductEditForm 
            product={product}
            inventory={inventory}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onProductUpdate={handleProductUpdate}
            onProductDelete={handleProductDelete}
        />
      )}
    </div>
  );
}
