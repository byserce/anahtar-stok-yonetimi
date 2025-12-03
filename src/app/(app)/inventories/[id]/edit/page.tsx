'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams, notFound } from 'next/navigation';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { getInventoryById, updateInventory } from '@/lib/storage';
import { X, Plus, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
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
import { inventoryIcons } from '@/lib/inventory-icons';
import { InventoryIcon } from '@/components/inventory-icon';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


const formSchema = z.object({
  name: z.string().min(2, { message: 'Envanter adı en az 2 karakter olmalıdır.' }),
  iconId: z.string().min(1, { message: 'Lütfen bir ikon seçin.' }),
  locations: z.array(z.object({ id: z.string(), name: z.string().min(1, { message: 'Konum adı boş olamaz.' }) })).min(1, { message: 'En az bir konum eklemelisiniz.' }).max(3, { message: 'En fazla 3 konum ekleyebilirsiniz.' }),
});

export default function EditInventoryPage() {
  const router = useRouter();
  const params = useParams();
  const inventoryId = params.id as string;
  
  const [inventory, setInventory] = useState(() => getInventoryById(inventoryId));
  const [loading, setLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [locationToRemove, setLocationToRemove] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      iconId: '',
      locations: [],
    },
  });

  useEffect(() => {
    const inv = getInventoryById(inventoryId);
    if (inv) {
        setInventory(inv);
        form.reset({
            name: inv.name,
            iconId: inv.iconId,
            locations: inv.locations.map(loc => ({ id: loc.id, name: loc.name })),
        });
    }
    setLoading(false);
  }, [inventoryId, form.reset]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'locations',
  });
  
  const handleRemoveClick = (index: number) => {
    setLocationToRemove(index);
    setIsAlertOpen(true);
  };

  const confirmRemove = () => {
    if (locationToRemove !== null) {
      remove(locationToRemove);
      setLocationToRemove(null);
    }
    setIsAlertOpen(false);
  };


  function onSubmit(values: z.infer<typeof formSchema>) {
    updateInventory(inventoryId, values);
    toast({
      title: 'Başarılı!',
      description: `${values.name} envanteri güncellendi.`,
    });
    router.push(`/inventories/${inventoryId}`);
    router.refresh();
  }
  
  if (loading) {
    return <Skeleton className="w-full h-96" />
  }

  if (!inventory) {
    return notFound();
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
            <h1 className="text-xl font-semibold">Envanteri Düzenle: {inventory.name}</h1>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
            <Card className="mx-auto max-w-2xl">
                <CardHeader>
                    <CardTitle>Envanter Detayları</CardTitle>
                    <CardDescription>Envanterinizin adını, ikonunu ve stok konumlarını güncelleyin.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                         <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Envanter Adı</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="iconId"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>Envanter İkonu</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2"
                                    >
                                        {inventoryIcons.map((icon) => (
                                            <FormItem key={icon.id} className="flex items-center justify-center">
                                                <FormControl>
                                                   <RadioGroupItem value={icon.id} id={`icon-${icon.id}`} className="sr-only" />
                                                </FormControl>
                                                <FormLabel htmlFor={`icon-${icon.id}`} className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground", field.value === icon.id && "border-primary")}>
                                                    <InventoryIcon iconId={icon.id} className="h-8 w-8" />
                                                </FormLabel>
                                            </FormItem>
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div>
                            <FormLabel>Konumlar</FormLabel>
                            <FormDescription className="mb-4">Ürün stoklarını takip edeceğiniz yerler (en fazla 3 adet).</FormDescription>
                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <FormField
                                        key={field.id}
                                        control={form.control}
                                        name={`locations.${index}.name`}
                                        render={({ field: inputField }) => (
                                        <FormItem className="flex items-center gap-2">
                                            <FormControl>
                                                <Input {...inputField} placeholder={`Konum ${index + 1}`} />
                                            </FormControl>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveClick(index)} disabled={fields.length <= 1}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </FormItem>
                                        )}
                                    />
                                ))}
                                 <FormMessage>{form.formState.errors.locations?.root?.message || form.formState.errors.locations?.message}</FormMessage>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-3"
                                onClick={() => append({ id: `new_${Date.now()}`, name: '' })}
                                disabled={fields.length >= 3}
                                >
                                <Plus className="mr-2 h-4 w-4" />
                                Konum Ekle
                            </Button>
                        </div>
                        
                        <Button type="submit" className="w-full md:w-auto" size="lg">Değişiklikleri Kaydet</Button>
                    </form>
                    </Form>
                </CardContent>
            </Card>
        </main>
         <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                <AlertDialogDescription>
                    Bu konumu silmek, bu konuma ait tüm stok verilerini kalıcı olarak silecektir. 
                    Bu işlem geri alınamaz.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setLocationToRemove(null)}>İptal</AlertDialogCancel>
                <AlertDialogAction onClick={confirmRemove} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
