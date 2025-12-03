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
  FormDescription,
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
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const formSchema = z.object({
  name: z.string().min(2, { message: 'Ürün adı en az 2 karakter olmalıdır.' }),
  code: z.string().min(3, { message: 'Ürün kodu en az 3 karakter olmalıdır.' }),
  purchasePrice: z.coerce.number().min(0, { message: 'Alış fiyatı 0 veya daha büyük olmalıdır.' }),
  salePrice: z.coerce.number().min(0.01, { message: 'Satış fiyatı 0 veya daha büyük olmalıdır.' }).optional().or(z.literal('')),
  criticalThreshold: z.coerce.number().min(0, { message: 'Kritik eşik 0 veya daha büyük olmalıdır.' }),
});

type ProductEditFormProps = {
  product: Product;
  inventory: Inventory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdate: (updatedProduct: Product) => void;
  onProductDelete: () => void;
};

export default function ProductEditForm({ product, inventory, open, onOpenChange, onProductUpdate, onProductDelete }: ProductEditFormProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      name: product.name,
      code: product.code,
      purchasePrice: product.purchasePrice || 0,
      salePrice: product.salePrice || '',
      criticalThreshold: inventory.criticalThresholds[product.id] || 0,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const submissionValues = {
        ...values,
        salePrice: values.salePrice === '' ? undefined : Number(values.salePrice),
    };
    const updatedProduct = updateProductDetails(product.id, submissionValues, inventory.id);
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

  const handleDeleteClick = () => {
    onProductDelete();
    setIsAlertOpen(false);
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ürün Bilgilerini Düzenle</DialogTitle>
            <DialogDescription>
              Ürünün temel bilgilerini ve fiyatlarını buradan güncelleyebilirsiniz.
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
              <div className="grid grid-cols-2 gap-4">
                  <FormField
                      control={form.control}
                      name="purchasePrice"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Alış Fiyatı (TL)</FormLabel>
                          <FormControl>
                              <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="salePrice"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Satış Fiyatı (TL)</FormLabel>
                          <FormControl>
                              <Input type="number" {...field} placeholder="İsteğe bağlı"/>
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
              </div>
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
              <DialogFooter className="sm:justify-between">
                <Button type="button" variant="destructive" onClick={() => setIsAlertOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Ürünü Sil
                </Button>
                <Button type="submit">Değişiklikleri Kaydet</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu ürün, bu envanterden kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClick} className="bg-destructive hover:bg-destructive/90">
                Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
