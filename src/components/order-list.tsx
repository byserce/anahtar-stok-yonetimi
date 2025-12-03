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

export default function OrderList({ inventory }: { inventory: Inventory}) {
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
  const [productsWithStock, setProductsWithStock] = useState<{product: Product, stock: ProductStock}[]>([]);

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
    let orderText = 'Sipariş Listesi:\n-----------------\n';
    let hasItems = false;
    
    for (const { product } of productsWithStock) {
      const quantity = orderQuantities[product.id];
      if (quantity && quantity > 0) {
        orderText += `(${product.code}) ${product.name}: ${quantity} adet\n`;
        hasItems = true;
      }
    }

    if (!hasItems) {
      toast({
        title: 'Boş Liste',
        description: 'Paylaşmak için lütfen en az bir ürüne sipariş adedi girin.',
        variant: 'destructive'
      });
      return;
    }

    orderText += `\nOluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'StockPilot Sipariş Listesi',
          text: orderText,
        });
        toast({
          title: 'Başarılı!',
          description: 'Sipariş listesi paylaşıldı.',
        });
      } catch (error) {
        console.error('Paylaşım hatası:', error);
        toast({
          title: 'Hata',
          description: 'Liste paylaşılırken bir sorun oluştu.',
          variant: 'destructive',
        });
      }
    } else {
      try {
        await navigator.clipboard.writeText(orderText);
        toast({
          title: 'Panoya Kopyalandı',
          description: 'Tarayıcınız paylaşımı desteklemiyor. Sipariş listesi panoya kopyalandı.',
        });
      } catch(err) {
        toast({
            title: 'Hata',
            description: 'Liste panoya kopyalanamadı.',
            variant: 'destructive'
        })
      }
    }
  };

  return (
    <Card className="mx-auto max-w-4xl">
      <CardHeader>
        <CardTitle>Sipariş Listesi Oluşturma</CardTitle>
        <CardDescription>Tedarikçilerinize göndermek için sipariş listenizi hazırlayın. Sadece adedini girdiğiniz ürünler listeye eklenecektir.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Görsel</TableHead>
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead>Ürün Kodu</TableHead>
                  <TableHead className="text-center">Mevcut Stok</TableHead>
                  <TableHead className="w-[120px] text-right">Sipariş Adedi</TableHead>
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
                        <p className="text-sm text-muted-foreground mt-1">Mevcut Stok: {getTotalStock(stock, inventory.locations)}</p>
                    </div>
                </div>
                <Separator className="my-3" />
                <div className="flex items-center justify-between">
                    <label htmlFor={`order-${product.id}`} className="text-sm font-medium">Sipariş Adedi</label>
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
          Listeyi Paylaş
        </Button>
      </CardFooter>
    </Card>
  );
}
