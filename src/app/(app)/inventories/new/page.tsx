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
import { useTranslation } from '@/context/translation-context';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Inventory name must be at least 2 characters.' }),
  iconId: z.string().min(1, { message: 'Please select an inventory icon.' }),
  locations: z.array(z.object({ name: z.string().min(1, { message: 'Location name cannot be empty.' }) })).min(1, { message: 'You must add at least one location.' }).max(3, { message: 'You can add a maximum of 3 locations.' }),
});

export default function NewInventoryPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const translatedFormSchema = z.object({
    name: z.string().min(2, { message: t('inventory_name_min_char', { count: 2 }) }),
    iconId: z.string().min(1, { message: t('select_inventory_icon_message') }),
    locations: z.array(z.object({ name: z.string().min(1, { message: t('location_name_empty_message') }) })).min(1, { message: t('at_least_one_location_message') }).max(3, { message: t('max_locations_message', { count: 3 }) }),
  });


  const form = useForm<z.infer<typeof translatedFormSchema>>({
    resolver: zodResolver(translatedFormSchema),
    defaultValues: {
      name: '',
      iconId: inventoryIcons[0].id,
      locations: [{ name: t('default_location_1') }, { name: t('default_location_2') }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'locations',
  });

  function onSubmit(values: z.infer<typeof translatedFormSchema>) {
    const newInventory = createInventory(values.name, values.iconId, values.locations);
    toast({
      title: t('success'),
      description: t('inventory_created_message', { name: values.name }),
    });
    router.push(`/inventories/${newInventory.id}`);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
       <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href="/">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">{t('back')}</span>
                </Link>
            </Button>
            <h1 className="text-xl font-semibold">{t('create_new_inventory')}</h1>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
            <Card className="mx-auto max-w-2xl">
                <CardHeader>
                    <CardTitle>{t('inventory_details')}</CardTitle>
                    <CardDescription>{t('new_inventory_description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('inventory_name')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('inventory_name_placeholder')} {...field} />
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
                                <FormLabel>{t('inventory_icon')}</FormLabel>
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
                            <FormLabel>{t('locations')}</FormLabel>
                            <FormDescription className="mb-4">{t('locations_description', { count: 3 })}</FormDescription>
                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <FormField
                                        key={field.id}
                                        control={form.control}
                                        name={`locations.${index}.name`}
                                        render={({ field }) => (
                                        <FormItem className="flex items-center gap-2">
                                            <FormControl>
                                                <Input {...field} placeholder={`${t('location')} ${index + 1}`} />
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
                                {t('add_location')}
                            </Button>
                        </div>
                        

                        <Button type="submit" className="w-full md:w-auto" size="lg">{t('create_inventory')}</Button>
                    </form>
                    </Form>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
