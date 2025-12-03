'use client';

import OrderList from '@/components/order-list';
import { getInventoryById } from '@/lib/storage';
import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function OrderForInventoryPage() {
    const params = useParams();
    const inventoryId = params.id as string;
    const inventory = getInventoryById(inventoryId);

    if (!inventory) {
        notFound();
    }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
         <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/inventories/${inventoryId}`}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Geri</span>
            </Link>
        </Button>
        <h1 className="text-xl font-semibold">Sipariş Oluştur</h1>
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <OrderList inventory={inventory} />
      </main>
    </div>
  );
}
