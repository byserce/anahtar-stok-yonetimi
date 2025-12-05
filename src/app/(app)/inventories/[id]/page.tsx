'use client';
import { useState, useEffect } from 'react';
import {
  getInventoryById,
  getProductsForInventory,
  updateInventoryProductOrder,
} from '@/lib/storage';
import type { Product, Inventory, ProductStock } from '@/lib/data';
import ProductCard from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { GripVertical, Check, ArrowLeft, Settings } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableProductCard } from '@/components/sortable-product-card';
import { notFound, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { InventoryIcon } from '@/components/inventory-icon';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/translation-context';

export default function InventoryDetailPage() {
  const params = useParams();
  const inventoryId = params.id as string;
  const { t } = useTranslation();

  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [products, setProducts] = useState<{ product: Product, stock: ProductStock }[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (inventoryId) {
      const foundInventory = getInventoryById(inventoryId);
      if (foundInventory) {
        setInventory(foundInventory);
        setProducts(getProductsForInventory(inventoryId));
      }
      setLoading(false);
    }
  }, [inventoryId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const moveProduct = (productId: string, direction: 'up' | 'down') => {
    setProducts((currentProducts) => {
      const index = currentProducts.findIndex(p => p.product.id === productId);
      if (index === -1) return currentProducts;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= currentProducts.length) {
        return currentProducts;
      }
      
      const newOrder = arrayMove(currentProducts, index, newIndex);
      const newProductIds = newOrder.map(item => item.product.id);
      updateInventoryProductOrder(inventoryId, newProductIds);
      
      return newOrder;
    });
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setProducts((items) => {
        const oldIndex = items.findIndex((item) => item.product.id === active.id);
        const newIndex = items.findIndex((item) => item.product.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        const newProductIds = newOrder.map(item => item.product.id);
        updateInventoryProductOrder(inventoryId, newProductIds);

        return newOrder;
      });
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
                </div>
            ))}
        </div>
      </div>
    );
  }

  if (!inventory) {
    return notFound();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href="/">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">{t('back')}</span>
                </Link>
            </Button>
             <div className="flex items-center gap-3">
              <InventoryIcon iconId={inventory.iconId} className="h-7 w-7 text-muted-foreground" />
              <h1 className="text-xl font-semibold truncate">{inventory.name}</h1>
            </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={editMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                {t('done')}
              </>
            ) : (
              <>
                <GripVertical className="mr-2 h-4 w-4" />
                {t('sort')}
              </>
            )}
          </Button>
          <Button variant="outline" size="icon" asChild className="h-9 w-9">
              <Link href={`/inventories/${inventoryId}/edit`}>
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">{t('edit_inventory')}</span>
              </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        {editMode ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={products.map(p => p.product.id)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                  {products.map(({ product, stock }, index) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      >
                        <SortableProductCard 
                          product={product} 
                          stock={stock} 
                          inventory={inventory} 
                          onMove={moveProduct}
                          isFirst={index === 0}
                          isLast={index === products.length - 1}
                        />
                      </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map(({ product, stock }) => (
              <ProductCard key={product.id} product={product} stock={stock} inventory={inventory} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
