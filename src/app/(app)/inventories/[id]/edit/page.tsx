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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { getInventoryById, updateInventory, deleteInventory } from '@/lib/storage';
import { Plus, ArrowLeft, Trash2 } from 'lucide-react';
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
import { useTranslation } from '@/context/translation-context';


const formSchema = z.object({
  name: z.string().min(2, { message: 'Inventory name must be at least 2 characters.' }),
  iconId: z.string().min(1, { message: 'Please select an icon.' }),
  locations: z.array(z.object({ id: z.string(), name: z.string().min(1, { message: 'Location name cannot be empty.' }) })).min(1, { message: 'You must add at least one location.' }).max(3, { message: 'You can add a maximum of 3 locations.' }),
});

export default function EditInventoryPage() {
  const router = useRouter();
  const params = useParams();
  const inventoryId = params.id as string;
  const { t } = useTranslation();
  
  const [inventory, setInventory] = useState(() => getInventoryById(inventoryId));
  const [loading, setLoading] = useState(true);
  const [isLocationAlertOpen, setIsLocationAlertOpen] = useState(false);
  const [isInventoryAlertOpen, setIsInventoryAlertOpen] = useState(false);
  const [locationToRemove, setLocationToRemove] = useState<number | null>(null);

  const translatedFormSchema = z.object({
    name: z.string().min(2, { message: t('inventory_name_min_char', { count: 2 }) }),
    iconId: z.string().min(1, { message: t('select_inventory_icon_message') }),
    locations: z.array(z.object({ id: z.string(), name: z.string().min(1, { message: t('location_name_empty_message') }) })).min(1, { message: t('at_least_one_location_message') }).max(3, { message: t('max_locations_message', { count: 3 }) }),
  });

  const form = useForm<z.infer<typeof translatedFormSchema>>({
    resolver: zodResolver(translatedFormSchema),
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
  
  const handleRemoveLocationClick = (index: number) => {
    setLocationToRemove(index);
    setIsLocationAlertOpen(true);
  };

  const confirmRemoveLocation = () => {
    if (locationToRemove !== null) {
      remove(locationToRemove);
      setLocationToRemove(null);
    }
    setIsLocationAlertOpen(false);
  };


  function onSubmit(values: z.infer<typeof translatedFormSchema>) {
    updateInventory(inventoryId, values);
    toast({
      title: t('success'),
      description: t('inventory_updated_message', { name: values.name }),
    });
    router.push(`/inventories/${inventoryId}`);
    router.refresh();
  }

  const handleDeleteInventory = () => {
    deleteInventory(inventoryId);
    toast({
        title: t('inventory_deleted_title'),
        description: t('inventory_deleted_description', { name: inventory?.name }),
    });
    router.push('/');
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
                    <span className="sr-only">{t('back')}</span>
                </Link>
            </Button>
            <h1 className="text-xl font-semibold">{t('edit_inventory')}: {inventory.name}</h1>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
            <Card className="mx-auto max-w-2xl">
                <CardHeader>
                    <CardTitle>{t('inventory_details')}</CardTitle>
                    <CardDescription>{t('edit_inventory_description')}</CardDescription>
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
                            <FormLabel>{t('locations')}</FormLabel>
                            <FormDescription className="mb-4">{t('locations_description', { count: 3 })}</FormDescription>
                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <FormField
                                        key={field.id}
                                        control={form.control}
                                        name={`locations.${index}.name`}
                                        render={({ field: inputField }) => (
                                        <FormItem className="flex items-center gap-2">
                                            <FormControl>
                                                <Input {...inputField} placeholder={`${t('location')} ${index + 1}`} />
                                            </FormControl>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveLocationClick(index)} disabled={fields.length <= 1}>
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
                                {t('add_location')}
                            </Button>
                        </div>
                        
                        <Button type="submit" className="w-full md:w-auto" size="lg">{t('save_changes')}</Button>
                    </form>
                    </Form>
                </CardContent>
                <CardFooter className="border-t border-destructive/20 p-6 bg-destructive/5">
                    <div className="w-full">
                        <h3 className="text-lg font-semibold text-destructive">{t('danger_zone')}</h3>
                        <p className="text-sm text-destructive/80 mt-1 mb-4">{t('delete_inventory_warning')}</p>
                        <Button variant="destructive" onClick={() => setIsInventoryAlertOpen(true)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('delete_this_inventory')}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </main>

         <AlertDialog open={isLocationAlertOpen} onOpenChange={setIsLocationAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>{t('confirm_delete_location_title')}</AlertDialogTitle>
                <AlertDialogDescription>
                   {t('confirm_delete_location_description')}
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setLocationToRemove(null)}>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={confirmRemoveLocation} className="bg-destructive hover:bg-destructive/90">{t('delete')}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isInventoryAlertOpen} onOpenChange={setIsInventoryAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>{t('confirm_delete_inventory_title')}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t('confirm_delete_inventory_description', { name: inventory.name })}
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteInventory} className="bg-destructive hover:bg-destructive/90">
                    {t('yes_delete')}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
