'use client';

import {
  type AppData,
  type Product,
  type Inventory,
  type Location,
  type ProductStock,
  type ProductImage,
} from './data';
import { PlaceHolderImages } from './placeholder-images';

const APP_DATA_STORAGE_KEY = 'stockpilot_app_data';
let appData: AppData | null = null;

// =================================================================
// INITIALIZATION
// =================================================================

const getInitialData = (): AppData => {
  const defaultInventoryId = 'inv_1';
  const defaultLocations: Location[] = [
    { id: 'loc_1', name: 'Depo' },
    { id: 'loc_2', name: 'Dükkan' },
    { id: 'loc_3', name: 'Araç' },
  ];

  const initialProducts: Product[] = [
      { id: 'prod_1', name: 'Barel Kilit Seti', code: 'KLT-BRL-01', image: { ...PlaceHolderImages.find(p=>p.id === 'cylinder-lock')!, iconId: undefined }, purchasePrice: 150, salePrice: 250 },
      { id: 'prod_2', name: 'Asma Kilit (Orta Boy)', code: 'KLT-ASM-02', image: { ...PlaceHolderImages.find(p=>p.id === 'padlock')!, iconId: undefined }, purchasePrice: 75, salePrice: 120 },
      { id: 'prod_3', name: 'Akıllı Kilit Sistemi', code: 'KLT-AKL-03', image: { ...PlaceHolderImages.find(p=>p.id === 'smart-lock')!, iconId: undefined }, purchasePrice: 1200, salePrice: 1800 },
      { id: 'prod_4', name: 'Çelik Kapı Kolu', code: 'AK-KPK-04', image: { ...PlaceHolderImages.find(p=>p.id === 'door-handle')!, iconId: undefined }, purchasePrice: 200, salePrice: 350 },
      { id: 'prod_5', name: 'Ham Anahtar Paketi (100 adet)', code: 'ANH-HAM-05', image: { ...PlaceHolderImages.find(p=>p.id === 'key-bunch')!, iconId: undefined }, purchasePrice: 80, salePrice: 150 },
  ];
  
  const productStocks: ProductStock[] = [
      { productId: 'prod_1', inventoryId: defaultInventoryId, stockByLocation: { loc_1: 10, loc_2: 4, loc_3: 2 } },
      { productId: 'prod_2', inventoryId: defaultInventoryId, stockByLocation: { loc_1: 25, loc_2: 15, loc_3: 8 } },
      { productId: 'prod_3', inventoryId: defaultInventoryId, stockByLocation: { loc_1: 3, loc_2: 1, loc_3: 1 } },
      { productId: 'prod_4', inventoryId: defaultInventoryId, stockByLocation: { loc_1: 15, loc_2: 12, loc_3: 3 } },
      { productId: 'prod_5', inventoryId: defaultInventoryId, stockByLocation: { loc_1: 5, loc_2: 2, loc_3: 4 } },
  ];

  const defaultInventory: Inventory = {
    id: defaultInventoryId,
    name: 'Ana Envanter',
    iconId: 'warehouse',
    locations: defaultLocations,
    productIds: initialProducts.map(p => p.id),
    criticalThresholds: {
        'prod_1': 5,
        'prod_2': 10,
        'prod_3': 2,
        'prod_4': 8,
        'prod_5': 3,
    },
  };

  return {
    products: initialProducts.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}),
    inventories: { [defaultInventoryId]: defaultInventory },
    productStocks: productStocks.reduce((acc, ps) => ({ ...acc, [`${ps.inventoryId}_${ps.productId}`]: ps }), {}),
  };
};

const initializeStorage = (): AppData => {
    if (typeof window === 'undefined') {
        return getInitialData(); // Sunucuda sadece başlangıç verisi döndür
    }
    try {
        const storedData = localStorage.getItem(APP_DATA_STORAGE_KEY);
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            // Basic validation to check if the data structure is roughly what we expect.
            // This is not a full-proof migration strategy, but prevents crashes on major changes.
            if (!parsedData.inventories || Object.values(parsedData.inventories).some((inv: any) => !inv.hasOwnProperty('name'))) {
                console.warn("Local storage data is in an old format. Resetting to initial data.");
                const initialData = getInitialData();
                localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(initialData));
                return initialData;
            }
             // Ensure all products have a purchasePrice.
            Object.values(parsedData.products).forEach((p: any) => {
                if (p.purchasePrice === undefined) {
                    p.purchasePrice = 0; // Default to 0 if not present
                }
            });

            return parsedData;
        } else {
            const initialData = getInitialData();
            localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(initialData));
            return initialData;
        }
    } catch (error) {
        console.error("Could not access localStorage. Using initial data.", error);
        return getInitialData();
    }
};


// =================================================================
// DATA ACCESS & MUTATION
// =================================================================

export const getAppData = (): AppData => {
  if (typeof window === 'undefined') {
    return getInitialData();
  }
  if (appData) {
    return appData;
  }
  appData = initializeStorage();
  return appData;
};

export const saveAppData = (data: AppData) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(data));
    appData = data;
  }
};

// --- Inventory Specific ---
export const getInventories = (): Inventory[] => {
    const data = getAppData();
    return Object.values(data.inventories);
}

export const getInventoryById = (id: string): Inventory | undefined => {
    const data = getAppData();
    return data.inventories[id];
}

export const createInventory = (name: string, iconId: string, locations: {name: string}[]) => {
    const data = getAppData();
    const newId = `inv_${Date.now()}`;
    const newLocations = locations.map((l, i) => ({ id: `loc_${Date.now()}_${i}`, name: l.name }));

    const newInventory: Inventory = {
        id: newId,
        name,
        iconId,
        locations: newLocations,
        productIds: [],
        criticalThresholds: {}
    };

    data.inventories[newId] = newInventory;
    saveAppData(data);
    return newInventory;
}

export const updateInventory = (inventoryId: string, updates: { name: string; iconId: string; locations: (Location & { originalId?: string })[] }) => {
  const data = getAppData();
  const inventory = data.inventories[inventoryId];

  if (!inventory) {
    return;
  }

  inventory.name = updates.name;
  inventory.iconId = updates.iconId;

  const oldLocations = inventory.locations;
  const newLocations = updates.locations;

  const keptLocationIds = new Set(newLocations.map(l => l.id));
  const deletedLocations = oldLocations.filter(loc => !keptLocationIds.has(loc.id));

  // If locations were deleted, remove their stock data
  if (deletedLocations.length > 0) {
    const deletedLocationIds = new Set(deletedLocations.map(l => l.id));
    for (const productId of inventory.productIds) {
      const stockKey = `${inventoryId}_${productId}`;
      const productStock = data.productStocks[stockKey];
      if (productStock) {
        deletedLocationIds.forEach(locId => {
          delete productStock.stockByLocation[locId];
        });
      }
    }
  }

  // Set the new locations, ensuring IDs are preserved if they existed
  inventory.locations = newLocations.map((loc, index) => ({
      id: loc.id || `loc_${Date.now()}_${index}`,
      name: loc.name
  }));
  
  saveAppData(data);
  return inventory;
};

export const deleteInventory = (inventoryId: string) => {
    const data = getAppData();
    const inventory = data.inventories[inventoryId];
    if (!inventory) {
        return;
    }

    // 1. Remove associated product stocks
    inventory.productIds.forEach(productId => {
        const stockKey = `${inventoryId}_${productId}`;
        delete data.productStocks[stockKey];
    });

    // 2. Delete the inventory itself
    delete data.inventories[inventoryId];
    
    // Note: We don't delete the products from the global `products` table,
    // as they might be used in other inventories.

    saveAppData(data);
};


// --- Product Specific ---
export const getProductsForInventory = (inventoryId: string): { product: Product, stock: ProductStock }[] => {
    const data = getAppData();
    const inventory = data.inventories[inventoryId];
    if (!inventory) return [];

    return inventory.productIds.map(productId => {
        const product = data.products[productId];
        const stock = data.productStocks[`${inventoryId}_${productId}`] || { productId, inventoryId, stockByLocation: {} };
        return { product, stock };
    }).filter(item => item.product);
}

export const getProductWithStock = (inventoryId: string, productId: string): { product: Product, stock: ProductStock, inventory: Inventory } | undefined => {
    const data = getAppData();
    const inventory = data.inventories[inventoryId];
    const product = data.products[productId];
    if (!inventory || !product) return undefined;
    
    const stock = data.productStocks[`${inventoryId}_${productId}`] || { productId, inventoryId, stockByLocation: {} };
    return { product, stock, inventory };
}


export const updateProductStock = (inventoryId: string, productId: string, locationId: string, newCount: number) => {
    const data = getAppData();
    const stockKey = `${inventoryId}_${productId}`;
    if (!data.productStocks[stockKey]) {
        data.productStocks[stockKey] = {
            inventoryId,
            productId,
            stockByLocation: {}
        };
    }
    data.productStocks[stockKey].stockByLocation[locationId] = newCount;
    saveAppData(data);
};

export const getTotalStock = (stock: ProductStock | undefined, locations: Location[]): number => {
    if (!stock) return 0;
    return locations.reduce((sum, loc) => sum + (stock.stockByLocation[loc.id] || 0), 0);
};

type AddProductValues = {
  name: string;
  code: string;
  criticalThreshold: number;
  purchasePrice: number;
  salePrice?: number;
  imageType: 'upload' | 'library' | 'icon';
  uploadedImage?: string;
  libraryImageId?: string;
  iconId?: string;
  initialStocks: Record<string, number>;
};

export const addProductToInventory = (inventoryId: string, values: AddProductValues) => {
    const data = getAppData();
    const inventory = data.inventories[inventoryId];
    if (!inventory) return null;

    let productImage: ProductImage;

    if (values.imageType === 'upload' && values.uploadedImage) {
        productImage = {
            imageUrl: values.uploadedImage,
            description: 'Kullanıcının yüklediği resim',
            imageHint: 'uploaded',
            iconId: undefined,
        };
    } else if (values.imageType === 'library' && values.libraryImageId) {
        const libImage = PlaceHolderImages.find(p => p.id === values.libraryImageId) || PlaceHolderImages[0];
        productImage = {
            imageUrl: libImage.imageUrl,
            description: libImage.description,
            imageHint: libImage.imageHint,
            iconId: undefined,
        };
    } else if (values.imageType === 'icon' && values.iconId) {
        productImage = {
            imageUrl: '',
            description: `${values.iconId} ikonu`,
            imageHint: 'icon',
            iconId: values.iconId,
        };
    } else {
        // Fallback
        const libImage = PlaceHolderImages[0];
        productImage = {
            imageUrl: libImage.imageUrl,
            description: libImage.description,
            imageHint: libImage.imageHint,
            iconId: undefined,
        };
    }


    // 1. Create new global product
    const newProductId = `prod_${Date.now()}`;
    const newProduct: Product = {
        id: newProductId,
        name: values.name,
        code: values.code,
        image: productImage,
        purchasePrice: values.purchasePrice,
        salePrice: values.salePrice,
    };
    data.products[newProductId] = newProduct;

    // 2. Add product to inventory
    inventory.productIds.unshift(newProductId); // Add to the beginning
    inventory.criticalThresholds[newProductId] = values.criticalThreshold;

    // 3. Create stock entry
    const newStock: ProductStock = {
        inventoryId,
        productId: newProductId,
        stockByLocation: values.initialStocks
    };
    data.productStocks[`${inventoryId}_${newProductId}`] = newStock;
    
    saveAppData(data);
    return { product: newProduct, stock: newStock, inventory };
};

export const updateInventoryProductOrder = (inventoryId: string, orderedProductIds: string[]) => {
    const data = getAppData();
    const inventory = data.inventories[inventoryId];
    if (inventory) {
        inventory.productIds = orderedProductIds;
        saveAppData(data);
    }
};

type UpdateProductDetails = {
    name: string;
    code: string;
    criticalThreshold: number;
    purchasePrice: number;
    salePrice?: number;
    imageType: 'upload' | 'library' | 'icon';
    uploadedImage?: string;
    libraryImageId?: string;
    iconId?: string;
}

export const updateProductDetails = (productId: string, updatedDetails: UpdateProductDetails, inventoryId: string) => {
    const data = getAppData();
    const product = data.products[productId];
    const inventory = data.inventories[inventoryId];

    if (product && inventory) {
        product.name = updatedDetails.name;
        product.code = updatedDetails.code;
        product.purchasePrice = updatedDetails.purchasePrice;
        product.salePrice = updatedDetails.salePrice;
        inventory.criticalThresholds[productId] = updatedDetails.criticalThreshold;

        let productImage: ProductImage;
        if (updatedDetails.imageType === 'upload' && updatedDetails.uploadedImage) {
            productImage = {
                imageUrl: updatedDetails.uploadedImage,
                description: 'Kullanıcının yüklediği resim',
                imageHint: 'uploaded',
                iconId: undefined,
            };
        } else if (updatedDetails.imageType === 'library' && updatedDetails.libraryImageId) {
            const libImage = PlaceHolderImages.find(p => p.id === updatedDetails.libraryImageId) || PlaceHolderImages[0];
            productImage = {
                imageUrl: libImage.imageUrl,
                description: libImage.description,
                imageHint: libImage.imageHint,
                iconId: undefined,
            };
        } else if (updatedDetails.imageType === 'icon' && updatedDetails.iconId) {
            productImage = {
                imageUrl: '',
                description: `${updatedDetails.iconId} ikonu`,
                imageHint: 'icon',
                iconId: updatedDetails.iconId,
            };
        } else {
            productImage = product.image; // Keep the old image if something is wrong
        }
        product.image = productImage;

        saveAppData(data);
        return product;
    }
    return undefined;
};


export const deleteProductFromInventory = (inventoryId: string, productId: string) => {
    const data = getAppData();
    const inventory = data.inventories[inventoryId];
    if (!inventory) {
        return;
    }

    // 1. Remove from inventory's product list
    inventory.productIds = inventory.productIds.filter(id => id !== productId);

    // 2. Remove from inventory's critical thresholds
    delete inventory.criticalThresholds[productId];

    // 3. Remove product's stock record for this inventory
    const stockKey = `${inventoryId}_${productId}`;
    delete data.productStocks[stockKey];

    // We do not delete from the global product list `data.products`
    // as it might be used in other inventories. A garbage collection
    // mechanism could be implemented later if needed.

    saveAppData(data);
};
