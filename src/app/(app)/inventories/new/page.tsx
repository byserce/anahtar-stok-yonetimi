'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
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
import { createInventory } from '@/lib/storage';
import { X, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { inventoryIcons } from '@/lib/inventory-icons';
import { InventoryIcon } from '@/components/inventory-icon';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Envanter adı en az 2 karakter olmalıdır.' }),
  iconId: z.string().min(1, { message: 'Lütfen bir envanter ikonu seçin.' }),
  locations: z.array(z.object({ name: z.string().min(1, { message: 'Konum adı boş olamaz.' }) })).min(1, { message: 'En az bir konum eklemelisiniz.' }).max(3, { message: 'En fazla 3 konum ekleyebilirsiniz.' }),
});

export default function NewInventoryPage() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      iconId: inventoryIcons[0].id,
      locations: [{ name: 'Mutfak' }, { name: 'Kiler' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'locations',
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newInventory = createInventory(values.name, values.iconId, values.locations);
    toast({
      title: 'Başarılı!',
      description: `${values.name} envanteri oluşturuldu.`,
    });
    router.push(`/inventories/${newInventory.id}`);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
       <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href="/">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Geri</span>
                </Link>
            </Button>
            <h1 className="text-xl font-semibold">Yeni Envanter Oluştur</h1>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
            <Card className="mx-auto max-w-2xl">
                <CardHeader>
                    <CardTitle>Envanter Detayları</CardTitle>
                    <CardDescription>Yeni envanterinize bir isim ve ikon seçin, ardından stok tutmak istediğiniz konumları belirleyin.</CardDescription>
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
                                        <Input placeholder="Örn: Ev, Ofis, Küçük İşletme" {...field} />
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
                                                   <RadioGroupItem value={icon.id} id={icon.id} className="sr-only" />
                                                </FormControl>
                                                <FormLabel htmlFor={icon.id} className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground", field.value === icon.id && "border-primary")}>
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
                                        render={({ field }) => (
                                        <FormItem className="flex items-center gap-2">
                                            <FormControl>
                                                <Input {...field} placeholder={`Konum ${index + 1}`} />
                                            </FormControl>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </FormItem>
                                        )}
                                    />
                                ))}
                                 <FormMessage>{form.formState.errors.locations?.message}</FormMessage>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-3"
                                onClick={() => append({ name: '' })}
                                disabled={fields.length >= 3}
                                >
                                <Plus className="mr-2 h-4 w-4" />
                                Konum Ekle
                            </Button>
                        </div>
                        

                        <Button type="submit" className="w-full md:w-auto" size="lg">Envanteri Oluştur</Button>
                    </form>
                    </Form>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
