'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import type { Product, Inventory } from '@/lib/data';
import { updateProductDetails } from '@/lib/storage';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Ürün adı en az 2 karakter olmalıdır.' }),
  code: z.string().min(3, { message: 'Ürün kodu en az 3 karakter olmalıdır.' }),
  criticalThreshold: z.coerce.number().min(0, { message: 'Kritik eşik 0 veya daha büyük olmalıdır.' }),
});

type ProductEditFormProps = {
  product: Product;
  inventory: Inventory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdate: (updatedProduct: Product) => void;
};

export default function ProductEditForm({ product, inventory, open, onOpenChange, onProductUpdate }: ProductEditFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      name: product.name,
      code: product.code,
      criticalThreshold: inventory.criticalThresholds[product.id] || 0,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const updatedProduct = updateProductDetails(product.id, values, inventory.id);
    if (updatedProduct) {
        onProductUpdate(updatedProduct);
        toast({
          title: 'Başarılı!',
          description: `${values.name} ürünü başarıyla güncellendi.`,
        });
        onOpenChange(false);
    } else {
        toast({
            title: 'Hata!',
            description: `Ürün güncellenirken bir sorun oluştu.`,
            variant: 'destructive',
          });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ürün Bilgilerini Düzenle</DialogTitle>
          <DialogDescription>
            Ürünün temel bilgilerini buradan güncelleyebilirsiniz.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ürün Adı</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ürün Kodu</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="criticalThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kritik Eşik Değeri</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Değişiklikleri Kaydet</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
