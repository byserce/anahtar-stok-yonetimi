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

const formSchema = z.object({
  name: z.string().min(2, { message: 'Ürün adı en az 2 karakter olmalıdır.' }),
  code: z.string().min(3, { message: 'Ürün kodu en az 3 karakter olmalıdır.' }),
  purchasePrice: z.coerce.number().min(0, { message: 'Alış fiyatı 0 veya daha büyük olmalıdır.' }),
  salePrice: z.coerce.number().min(0.01, { message: 'Satış fiyatı 0 veya daha büyük olmalıdır.' }).optional().or(z.literal('')),
  criticalThreshold: z.coerce.number().min(0, { message: 'Kritik eşik 0 veya daha büyük olmalıdır.' }),
  imageType: z.enum(['upload', 'icon']),
  uploadedImage: z.string().optional(),
  iconId: z.string().optional(),
}).refine(data => {
    if (data.imageType === 'upload') return !!data.uploadedImage;
    if (data.imageType === 'icon') return !!data.iconId;
    return false;
}, {
    message: "Lütfen bir ürün görseli seçin veya yükleyin.",
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
  
  // Cropping state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const isIcon = !!product.image.iconId;
  const initialImageType = isIcon ? 'icon' : 'upload';

  const [imagePreview, setImagePreview] = useState<string | null>(initialImageType === 'upload' ? product.image.imageUrl : null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
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
                title: "Resim Kırpılamadı",
                description: "Resim kırpılırken bir hata oluştu. Lütfen tekrar deneyin.",
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ürün Bilgilerini Düzenle</DialogTitle>
            <DialogDescription>
              Ürünün temel bilgilerini, fiyatlarını ve görselini buradan güncelleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[80vh] overflow-y-auto px-1">
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
                name="imageType"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Ürün Görseli</FormLabel>
                        <Tabs 
                            value={field.value} 
                            onValueChange={(value) => field.onChange(value as 'upload'|'icon')} 
                            className="w-full"
                        >
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="upload">Fotoğraf Yükle</TabsTrigger>
                                <TabsTrigger value="icon">İkon Seç</TabsTrigger>
                            </TabsList>
                            <TabsContent value="upload" className="mt-4">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                             <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed">
                                                {imagePreview ? (
                                                    <Image src={imagePreview} alt="Yüklenen resim önizlemesi" width={128} height={128} className="h-full w-full rounded-lg object-cover" />
                                                ) : (
                                                    <UploadCloud className="h-10 w-10 text-muted-foreground" />
                                                )}
                                             </div>
                                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                                {imagePreview ? 'Resmi Değiştir' : 'Resim Seç'}
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
              <DialogFooter className="sm:justify-between pt-4">
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

    <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Resmi Kırp</DialogTitle>
                <DialogDescription>
                    Ürün görseli olarak kullanılacak alanı seçin.
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
                <Button variant="outline" onClick={() => setIsCropDialogOpen(false)}>İptal</Button>
                <Button onClick={handleCropComplete}><Crop className="mr-2 h-4 w-4" /> Kırp ve Kullan</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    </>
  );
}
