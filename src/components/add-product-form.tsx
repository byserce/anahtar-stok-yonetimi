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
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { inventoryIcons } from '@/lib/inventory-icons';
import { InventoryIcon } from './inventory-icon';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';


const formSchema = z.object({
  name: z.string().min(2, { message: 'Ürün adı en az 2 karakter olmalıdır.' }),
  code: z.string().min(3, { message: 'Ürün kodu en az 3 karakter olmalıdır.'}),
  criticalThreshold: z.coerce.number().min(0, { message: 'Kritik eşik 0 veya daha büyük olmalıdır.' }),
  imageType: z.enum(['upload', 'library', 'icon']),
  uploadedImage: z.string().optional(),
  libraryImageId: z.string().optional(),
  iconId: z.string().optional(),
  initialStocks: z.record(z.coerce.number().min(0)),
}).refine(data => {
    if (data.imageType === 'upload') return !!data.uploadedImage;
    if (data.imageType === 'library') return !!data.libraryImageId;
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


export default function AddProductForm({ inventory }: { inventory: Inventory}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Cropping state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);


  const defaultValues = {
      name: '',
      code: '',
      criticalThreshold: 5,
      imageType: 'library' as const,
      uploadedImage: '',
      libraryImageId: PlaceHolderImages[0].id,
      iconId: '',
      initialStocks: inventory.locations.reduce((acc, loc) => ({ ...acc, [loc.id]: 0 }), {}),
  };
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
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
    setCompletedCrop(crop); // Initialize completedCrop
  };


  function onSubmit(values: z.infer<typeof formSchema>) {
    addProductToInventory(inventory.id, values);
    toast({
      title: 'Başarılı!',
      description: `${values.name} ürünü envantere eklendi.`,
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
        <CardTitle>Ürün Bilgileri</CardTitle>
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
                    <FormLabel>Ürün Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="Örn: Barel Kilit Seti" {...field} />
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
                      <Input placeholder="Örn: KLT-BRL-01" {...field} />
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
                        <FormLabel>Ürün Görseli</FormLabel>
                        <Tabs 
                            value={field.value} 
                            onValueChange={(value) => field.onChange(value as 'upload'|'library'|'icon')} 
                            className="w-full"
                        >
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="upload">Fotoğraf Yükle</TabsTrigger>
                                <TabsTrigger value="library">Kütüphane</TabsTrigger>
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
                                            <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="library" className="mt-4">
                               <FormField
                                    control={form.control}
                                    name="libraryImageId"
                                    render={({ field: radioField }) => (
                                        <FormItem>
                                            <RadioGroup 
                                                onValueChange={(value) => {
                                                  radioField.onChange(value);
                                                  form.setValue('imageType', 'library');
                                                }}
                                                defaultValue={radioField.value}
                                                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                                            >
                                                {PlaceHolderImages.map(img => (
                                                    <FormItem key={img.id}>
                                                        <FormControl>
                                                            <RadioGroupItem value={img.id} id={`lib-${img.id}`} className="sr-only" />
                                                        </FormControl>
                                                        <FormLabel htmlFor={`lib-${img.id}`}>
                                                            <div className={cn("cursor-pointer overflow-hidden rounded-md border-2 border-muted bg-popover transition-all hover:border-primary", radioField.value === img.id && "border-primary ring-2 ring-primary")}>
                                                                <Image src={img.imageUrl} alt={img.description} width={200} height={150} className="aspect-video w-full object-cover" />
                                                                <p className="p-2 text-xs font-medium truncate">{img.description}</p>
                                                            </div>
                                                        </FormLabel>
                                                    </FormItem>
                                                ))}
                                            </RadioGroup>
                                        </FormItem>
                                    )}
                                />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="criticalThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kritik Eşik Değeri</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>Bu sayının altına düşünce uyarı verilir.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            <div>
                <h3 className="mb-4 text-lg font-medium">Başlangıç Stokları</h3>
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

            <Button type="submit" className="w-full md:w-auto" size="lg">Ürünü Kaydet</Button>
          </form>
        </Form>
      </CardContent>
    </Card>

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

    