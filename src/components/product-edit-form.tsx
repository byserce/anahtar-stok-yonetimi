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
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import type { Product, Inventory } from '@/lib/data';
import { updateProductDetails } from '@/lib/storage';
import { Trash2, UploadCloud, Crop } from 'lucide-react';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { inventoryIcons } from '@/lib/inventory-icons';
import { InventoryIcon } from './inventory-icon';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
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
import { useTranslation } from '@/context/translation-context';
import { useSettings } from '@/context/settings-context';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Product name must be at least 2 characters.' }),
  code: z.string().min(3, { message: 'Product code must be at least 3 characters.' }),
  purchasePrice: z.coerce.number().min(0, { message: 'Purchase price must be 0 or greater.' }),
  salePrice: z.coerce.number().min(0.01, { message: 'Sale price must be 0 or greater.' }).optional().or(z.literal('')),
  criticalThreshold: z.coerce.number().min(0, { message: 'Critical threshold must be 0 or greater.' }),
  imageType: z.enum(['upload', 'icon']),
  uploadedImage: z.string().optional(),
  iconId: z.string().optional(),
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const { currency } = useSettings();

  // Cropping state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const isIcon = !!product.image.iconId;
  const initialImageType = isIcon ? 'icon' : 'upload';

  const [imagePreview, setImagePreview] = useState<string | null>(initialImageType === 'upload' ? product.image.imageUrl : null);
  
    const translatedFormSchema = z.object({
      name: z.string().min(2, { message: t('product_name_min_char', { count: 2 }) }),
      code: z.string().min(3, { message: t('product_code_min_char', { count: 3 }) }),
      purchasePrice: z.coerce.number().min(0, { message: t('purchase_price_min_value') }),
      salePrice: z.coerce.number().min(0.01, { message: t('sale_price_min_value') }).optional().or(z.literal('')),
      criticalThreshold: z.coerce.number().min(0, { message: t('critical_threshold_min_value') }),
      imageType: z.enum(['upload', 'icon']),
      uploadedImage: z.string().optional(),
      iconId: z.string().optional(),
    }).refine(data => {
        if (data.imageType === 'upload') return !!data.uploadedImage;
        if (data.imageType === 'icon') return !!data.iconId;
        return false;
    }, {
        message: t('select_product_image_message'),
        path: ["imageType"],
    });

  const form = useForm<z.infer<typeof translatedFormSchema>>({
    resolver: zodResolver(translatedFormSchema),
    values: {
      name: product.name,
      code: product.code,
      purchasePrice: product.purchasePrice || 0,
      salePrice: product.salePrice || '',
      criticalThreshold: inventory.criticalThresholds[product.id] || 0,
      imageType: initialImageType,
      iconId: product.image.iconId,
      uploadedImage: initialImageType === 'upload' ? product.image.imageUrl : undefined,
    },
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
    setCompletedCrop(crop);
  };


  function onSubmit(values: z.infer<typeof translatedFormSchema>) {
    const submissionValues = {
        ...values,
        salePrice: values.salePrice === '' ? undefined : Number(values.salePrice),
    };
    const updatedProduct = updateProductDetails(product.id, submissionValues, inventory.id);
    if (updatedProduct) {
        onProductUpdate(updatedProduct);
        toast({
          title: t('success'),
          description: t('product_updated_message', { name: values.name }),
        });
        onOpenChange(false);
    } else {
        toast({
            title: t('error'),
            description: t('product_update_error'),
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('edit_product_information')}</DialogTitle>
            <DialogDescription>
             {t('edit_product_description')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[80vh] overflow-y-auto px-1">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('product_name')}</FormLabel>
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
                    <FormLabel>{t('product_code')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                                        <ScrollArea className="h-60 w-full">
                                            <RadioGroup
                                                onValueChange={(value) => {
                                                    radioField.onChange(value);
                                                    form.setValue('imageType', 'icon');
                                                }}
                                                defaultValue={radioField.value}
                                                className="grid grid-cols-4 gap-2"
                                            >
                                                {inventoryIcons.map((icon) => (
                                                    <FormItem key={icon.id} className="flex items-center justify-center">
                                                        <FormControl>
                                                           <RadioGroupItem value={icon.id} id={`edit-icon-${icon.id}`} className="sr-only" />
                                                        </FormControl>
                                                        <FormLabel htmlFor={`edit-icon-${icon.id}`} className={cn("flex h-16 w-16 flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 transition-all hover:bg-accent hover:text-accent-foreground", radioField.value === icon.id && "border-primary")}>
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

              <div className="grid grid-cols-2 gap-4">
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
                              <Input type="number" {...field} placeholder={t('optional')}/>
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
                    <FormLabel>{t('critical_threshold_value')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="sm:justify-between pt-4">
                <Button type="button" variant="destructive" onClick={() => setIsAlertOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('delete_product')}
                </Button>
                <Button type="submit">{t('save_changes')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_product_confirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClick} className="bg-destructive hover:bg-destructive/90">
                {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
