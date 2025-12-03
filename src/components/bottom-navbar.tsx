'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, PlusCircle, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation'


export default function BottomNavbar() {
  const pathname = usePathname();
  const params = useParams();
  const inventoryId = params.id as string;
  
  if (!inventoryId) return null;

  const menuItems = [
    { href: `/inventories/${inventoryId}`, label: 'Envanter', icon: LayoutGrid },
    { href: `/inventories/${inventoryId}/add`, label: 'Ürün Ekle', icon: PlusCircle },
    { href: `/inventories/${inventoryId}/order`, label: 'Sipariş', icon: ShoppingCart },
  ];

  return (
    <nav className="sticky bottom-0 z-50 w-full border-t bg-background/95 backdrop-blur-sm">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                isActive && 'text-primary'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
