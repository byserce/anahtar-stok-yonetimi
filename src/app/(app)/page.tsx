// This is the new root page that lists all inventories.
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getInventories } from '@/lib/storage';
import type { Inventory } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ChevronRight, Package, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryIcon } from '@/components/inventory-icon';
import { useTranslation } from '@/context/translation-context';

export default function InventoriesListPage() {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    setInventories(getInventories());
    setLoading(false);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
        <h1 className="text-xl font-semibold">{t('my_inventories')}</h1>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/inventories/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('new_inventory')}
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon" className="h-9 w-9">
            <Link href="/settings">
              <Settings className="h-4 w-4" />
               <span className="sr-only">{t('settings')}</span>
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="space-y-4">
          {loading ? (
             Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
             ))
          ) : inventories.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">{t('no_inventories_yet')}</h3>
                <p className="mb-4 mt-2 text-sm text-muted-foreground">{t('start_by_creating_inventory')}</p>
                <Button asChild>
                    <Link href="/inventories/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('create_inventory')}
                    </Link>
                </Button>
            </div>
          ) : (
            inventories.map((inventory) => (
              <Link href={`/inventories/${inventory.id}`} key={inventory.id} className="block">
                <Card className="transition-all hover:bg-accent hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                    <div className="flex items-center gap-4">
                       <InventoryIcon iconId={inventory.iconId} className="h-10 w-10 text-primary" />
                       <div>
                          <CardTitle className="text-lg">{inventory.name}</CardTitle>
                          <CardDescription>
                            {t('inventory_card_description', { product_count: inventory.productIds.length, location_count: inventory.locations.length})}
                          </CardDescription>
                       </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                </Card>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
