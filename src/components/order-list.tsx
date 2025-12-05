'use client';

import { useState, useEffect } from 'react';
import { getProductsForInventory, getTotalStock } from '@/lib/storage';
import type { Product, Inventory, ProductStock } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Share2 } from 'lucide-react';
import Image from 'next/image';
import { Separator } from './ui/separator';
import { useTranslation } from '@/context/translation-context';

export default function OrderList({ inventory }: { inventory: Inventory}) {
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
  const [productsWithStock, setProductsWithStock] = useState<{product: Product, stock: ProductStock}[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    setProductsWithStock(getProductsForInventory(inventory.id));
  }, [inventory.id]);

  const handleQuantityChange = (productId: string, quantity: number) => {
    setOrderQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, quantity),
    }));
  };

  const handleShare = async () => {
    let orderText = `${t('order_list')}:\n-----------------\n`;
    let hasItems = false;
    
    for (const { product } of productsWithStock) {
      const quantity = orderQuantities[product.id];
      if (quantity && quantity > 0) {
        orderText += `(${product.code}) ${product.name}: ${quantity} ${t('units')}\n`;
        hasItems = true;
      }
    }

    if (!hasItems) {
      toast({
        title: t('empty_list'),
        description: t('empty_order_list_description'),
        variant: 'destructive'
      });
      return;
    }

    orderText += `\n${t('creation_date')}: ${new Date().toLocaleDateString(t('locale_code'))}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('app_name') + ' ' + t('order_list'),
          text: orderText,
        });
        toast({
          title: t('success'),
          description: t('order_list_shared'),
        });
      } catch (error) {
        console.error('Share error:', error);
        toast({
          title: t('error'),
          description: t('order_list_share_error'),
          variant: 'destructive',
        });
      }
    } else {
      try {
        await navigator.clipboard.writeText(orderText);
        toast({
          title: t('copied_to_clipboard'),
          description: t('share_not_supported_clipboard'),
        });
      } catch(err) {
        toast({
            title: t('error'),
            description: t('clipboard_copy_error'),
            variant: 'destructive'
        })
      }
    }
  };

  return (
    <Card className="mx-auto max-w-4xl">
      <CardHeader>
        <CardTitle>{t('create_order_list')}</CardTitle>
        <CardDescription>{t('create_order_list_description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">{t('image')}</TableHead>
                  <TableHead>{t('product_name')}</TableHead>
                  <TableHead>{t('product_code')}</TableHead>
                  <TableHead className="text-center">{t('current_stock')}</TableHead>
                  <TableHead className="w-[120px] text-right">{t('order_quantity')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsWithStock.map(({ product, stock }) => (
                  <TableRow key={product.id}>
                    <TableCell>
                        <Image
                            src={product.image.imageUrl}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="rounded-md object-cover"
                            data-ai-hint={product.image.imageHint}
                        />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="font-mono text-muted-foreground text-sm">{product.code}</TableCell>
                    <TableCell className="text-center">{getTotalStock(stock, inventory.locations)}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        className="text-right"
                        value={orderQuantities[product.id] || ''}
                        onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value, 10) || 0)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>

        <div className="sm:hidden space-y-4">
          {productsWithStock.map(({ product, stock }) => (
            <div key={product.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start gap-4">
                    <Image
                        src={product.image.imageUrl}
                        alt={product.name}
                        width={64}
                        height={64}
                        className="rounded-md object-cover"
                        data-ai-hint={product.image.imageHint}
                    />
                    <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm font-mono text-muted-foreground">{product.code}</p>
                        <p className="text-sm text-muted-foreground mt-1">{t('current_stock')}: {getTotalStock(stock, inventory.locations)}</p>
                    </div>
                </div>
                <Separator className="my-3" />
                <div className="flex items-center justify-between">
                    <label htmlFor={`order-${product.id}`} className="text-sm font-medium">{t('order_quantity')}</label>
                    <Input
                        id={`order-${product.id}`}
                        type="number"
                        min="0"
                        placeholder="0"
                        className="h-10 w-24 text-right text-base"
                        value={orderQuantities[product.id] || ''}
                        onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value, 10) || 0)}
                    />
                </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleShare} size="lg" className="w-full md:w-auto ml-auto">
          <Share2 className="mr-2 h-4 w-4" />
          {t('share_list')}
        </Button>
      </CardFooter>
    </Card>
  );
}
