'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { UploadCloud, Package, Crop } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { addProductToInventory } from '@/lib/storage';
import { type Inventory } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { inventoryIcons } from '@/lib/inventory-icons';
import { InventoryIcon } from './inventory-icon';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { useTranslation } from '@/context/translation-context';
import { useSettings } from '@/context/settings-context';


const formSchema = z.object({
  name: z.string().min(2, { message: 'Product name must be at least 2 characters.' }),
  code: z.string().min(3, { message: 'Product code must be at least 3 characters.'}),
  purchasePrice: z.coerce.number().min(0, { message: 'Purchase price must be 0 or greater.' }),
  salePrice: z.coerce.number().min(0, { message: 'Sale price must be 0 or greater.' }).optional().or(z.literal('')),
  criticalThreshold: z.coerce.number().min(0, { message: 'Critical threshold must be 0 or greater.' }),
  imageType: z.enum(['upload', 'icon']),
  uploadedImage: z.string().optional(),
  iconId: z.string().optional(),
  initialStocks: z.record(z.coerce.number().min(0)),
}).refine(data => {
    if (data.imageType === 'upload') return !!data.uploadedImage;
    if (data.imageType === 'icon') return !!data.iconId;
    return false;
}, {
    message: "Please upload an image or select an icon.",
    path: ["imageType"],
});

function getCroppedImg(image: HTMLImageElement, crop: Crop, fileName: string): Promise<string> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return Promise.reject(new Error('Canvas context is not available.'));
  }

  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = crop.width * pixelRatio;
  canvas.height = crop.height * pixelRatio;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    resolve(canvas.toDataURL('image/jpeg'));
  });
}


export default function AddProductForm({ inventory }: { inventory: Inventory}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { t } = useTranslation();
  const { currency } = useSettings();

  // Cropping state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const translatedFormSchema = z.object({
      name: z.string().min(2, { message: t('product_name_min_char', { count: 2 }) }),
      code: z.string().min(3, { message: t('product_code_min_char', { count: 3 }) }),
      purchasePrice: z.coerce.number().min(0, { message: t('purchase_price_min_value') }),
      salePrice: z.coerce.number().min(0, { message: t('sale_price_min_value') }).optional().or(z.literal('')),
      criticalThreshold: z.coerce.number().min(0, { message: t('critical_threshold_min_value') }),
      imageType: z.enum(['upload', 'icon']),
      uploadedImage: z.string().optional(),
      iconId: z.string().optional(),
      initialStocks: z.record(z.coerce.number().min(0)),
    }).refine(data => {
        if (data.imageType === 'upload') return !!data.uploadedImage;
        if (data.imageType === 'icon') return !!data.iconId;
        return false;
    }, {
        message: t('select_product_image_message'),
        path: ["imageType"],
    });

  const defaultValues = {
      name: '',
      code: '',
      purchasePrice: 0,
      salePrice: '' as number | '',
      criticalThreshold: 5,
      imageType: 'upload' as const,
      uploadedImage: '',
      iconId: inventoryIcons[0].id,
      initialStocks: inventory.locations.reduce((acc, loc) => ({ ...acc, [loc.id]: 0 }), {}),
  };
  
  const form = useForm<z.infer<typeof translatedFormSchema>>({
    resolver: zodResolver(translatedFormSchema),
    defaultValues,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        setIsCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async () => {
    if (completedCrop && imgRef.current) {
        try {
            const croppedImageUrl = await getCroppedImg(imgRef.current, completedCrop, 'cropped_image.jpg');
            setImagePreview(croppedImageUrl);
            form.setValue('uploadedImage', croppedImageUrl);
            form.setValue('imageType', 'upload');
            form.clearErrors('imageType');
            setIsCropDialogOpen(false);
        } catch (e) {
            console.error(e);
            toast({
                title: t('image_crop_failed_title'),
                description: t('image_crop_failed_description'),
                variant: "destructive"
            });
        }
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        16 / 9,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
    setCompletedCrop(crop); // Initialize completedCrop
  };


  function onSubmit(values: z.infer<typeof translatedFormSchema>) {
    const submissionValues = {
        ...values,
        salePrice: values.salePrice === '' ? undefined : Number(values.salePrice)
    };
    addProductToInventory(inventory.id, submissionValues);
    toast({
      title: t('success'),
      description: t('product_added_message', { name: values.name }),
    });
    form.reset(defaultValues);
    setImagePreview(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
    router.push(`/inventories/${inventory.id}`);
    router.refresh(); // to reflect changes on the inventory page
  }

  return (
    <>
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{t('product_information')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('product_name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('product_name_placeholder')} {...field} />
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
                    <FormLabel>{t('product_code')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('product_code_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
             <FormField
                control={form.control}
                name="imageType"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('product_image')}</FormLabel>
                        <Tabs 
                            value={field.value} 
                            onValueChange={(value) => field.onChange(value as 'upload'|'icon')} 
                            className="w-full"
                        >
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="upload">{t('upload_photo')}</TabsTrigger>
                                <TabsTrigger value="icon">{t('select_icon')}</TabsTrigger>
                            </TabsList>
                            <TabsContent value="upload" className="mt-4">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                             <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed">
                                                {imagePreview ? (
                                                    <Image src={imagePreview} alt={t('uploaded_image_preview')} width={128} height={128} className="h-full w-full rounded-lg object-cover" />
                                                ) : (
                                                    <UploadCloud className="h-10 w-10 text-muted-foreground" />
                                                )}
                                             </div>
                                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                                {imagePreview ? t('change_image') : t('select_image')}
                                            </Button>
                                            <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                            <p className="text-xs text-muted-foreground">PNG, JPG, GIF</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="icon" className="mt-4">
                                <FormField
                                    control={form.control}
                                    name="iconId"
                                    render={({ field: radioField }) => (
                                        <FormItem>
                                        <ScrollArea className="h-72 w-full">
                                            <RadioGroup
                                                onValueChange={(value) => {
                                                    radioField.onChange(value);
                                                    form.setValue('imageType', 'icon');
                                                }}
                                                defaultValue={radioField.value}
                                                className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2"
                                            >
                                                {inventoryIcons.map((icon) => (
                                                    <FormItem key={icon.id} className="flex items-center justify-center">
                                                        <FormControl>
                                                           <RadioGroupItem value={icon.id} id={`icon-${icon.id}`} className="sr-only" />
                                                        </FormControl>
                                                        <FormLabel htmlFor={`icon-${icon.id}`} className={cn("flex h-20 w-20 flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 transition-all hover:bg-accent hover:text-accent-foreground", radioField.value === icon.id && "border-primary")}>
                                                            <InventoryIcon iconId={icon.id} className="h-8 w-8" />
                                                        </FormLabel>
                                                    </FormItem>
                                                ))}
                                            </RadioGroup>
                                        </ScrollArea>
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>
                        </Tabs>
                         <FormMessage>{form.formState.errors.imageType?.message}</FormMessage>
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('purchase_price')} ({currency})</FormLabel>
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
                    <FormLabel>{t('sale_price')} ({currency})</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder={t('optional')} />
                    </FormControl>
                     <FormDescription>{t('can_be_left_empty')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="criticalThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('critical_threshold')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>{t('for_stock_alert')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
                <h3 className="mb-4 text-lg font-medium">{t('initial_stocks')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {inventory.locations.map(loc => (
                       <FormField
                         key={loc.id}
                         control={form.control}
                         name={`initialStocks.${loc.id}`}
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>{loc.name}</FormLabel>
                             <FormControl>
                               <Input type="number" {...field} />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                    ))}
                </div>
            </div>

            <Button type="submit" className="w-full md:w-auto" size="lg">{t('save_product')}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>

    <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>{t('crop_image')}</DialogTitle>
                <DialogDescription>
                    {t('crop_image_description')}
                </DialogDescription>
            </DialogHeader>
            <div className="my-4 flex justify-center">
               {sourceImage && (
                    <ReactCrop
                        crop={crop}
                        onChange={c => setCrop(c)}
                        onComplete={c => setCompletedCrop(c)}
                        aspect={16/9}
                    >
                        <Image
                            ref={imgRef}
                            alt="Crop me"
                            src={sourceImage}
                            onLoad={onImageLoad}
                            width={800}
                            height={450}
                            style={{ maxHeight: '70vh', objectFit: 'contain' }}
                        />
                    </ReactCrop>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsCropDialogOpen(false)}>{t('cancel')}</Button>
                <Button onClick={handleCropComplete}><Crop className="mr-2 h-4 w-4" /> {t('crop_and_use')}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    </>
  );
}
