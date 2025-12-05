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

const APP_DATA_STORAGE_KEY = 'stockpilot_app_data_v2';
let appData: AppData | null = null;

// =================================================================
// INITIALIZATION
// =================================================================

const getInitialData = (): AppData => {
  const defaultInventoryId = 'inv_1';
  const defaultLocations: Location[] = [
    { id: 'loc_1', name: 'Kitchen' },
    { id: 'loc_2', name: 'Pantry' },
    { id: 'loc_3', name: 'Garage' },
  ];

  const initialProducts: Product[] = [
      { id: 'prod_1', name: 'Pasta (500g)', code: 'FOOD-PST-01', image: { ...PlaceHolderImages.find(p=>p.id === 'pasta-noodles')!, iconId: undefined }, purchasePrice: 2, salePrice: 3.5 },
      { id: 'prod_2', name: 'Tomato Sauce', code: 'FOOD-SAU-02', image: { ...PlaceHolderImages.find(p=>p.id === 'canned-goods')!, iconId: undefined }, purchasePrice: 1.5, salePrice: 2.5 },
      { id: 'prod_3', name: 'Rice (1kg)', code: 'FOOD-RIC-03', image: { ...PlaceHolderImages.find(p=>p.id === 'rice-bag')!, iconId: undefined }, purchasePrice: 3, salePrice: 5 },
      { id: 'prod_4', name: 'LED Bulb (9W)', code: 'HOME-BUL-04', image: { ...PlaceHolderImages.find(p=>p.id === 'light-bulbs')!, iconId: undefined }, purchasePrice: 4, salePrice: 7 },
      { id: 'prod_5', name: 'Toilet Paper (12 pack)', code: 'HOME-TP-05', image: { ...PlaceHolderImages.find(p=>p.id === 'toilet-paper')!, iconId: undefined }, purchasePrice: 8, salePrice: 12 },
  ];
  
  const productStocks: ProductStock[] = [
      { productId: 'prod_1', inventoryId: defaultInventoryId, stockByLocation: { loc_1: 5, loc_2: 10, loc_3: 0 } },
      { productId: 'prod_2', inventoryId: defaultInventoryId, stockByLocation: { loc_1: 3, loc_2: 8, loc_3: 1 } },
      { productId: 'prod_3', inventoryId: defaultInventoryId, stockByLocation: { loc_1: 2, loc_2: 5, loc_3: 0 } },
      { productId: 'prod_4', inventoryId: defaultInventoryId, stockByLocation: { loc_1: 4, loc_2: 2, loc_3: 6 } },
      { productId: 'prod_5', inventoryId: defaultInventoryId, stockByLocation: { loc_1: 1, loc_2: 3, loc_3: 2 } },
  ];

  const defaultInventory: Inventory = {
    id: defaultInventoryId,
    name: 'My Home Inventory',
    iconId: 'home',
    locations: defaultLocations,
    productIds: initialProducts.map(p => p.id),
    criticalThresholds: {
        'prod_1': 2,
        'prod_2': 2,
        'prod_3': 1,
        'prod_4': 3,
        'prod_5': 2,
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
        return getInitialData(); // Return initial data on the server
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
  imageType: 'upload' | 'icon';
  uploadedImage?: string;
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
            description: 'User uploaded image',
            imageHint: 'uploaded',
            iconId: undefined,
        };
    } else if (values.imageType === 'icon' && values.iconId) {
        productImage = {
            imageUrl: '',
            description: `${values.iconId} icon`,
            imageHint: 'icon',
            iconId: values.iconId,
        };
    } else {
        // Fallback to a default icon if no image is provided
        productImage = {
            imageUrl: '',
            description: `package icon`,
            imageHint: 'icon',
            iconId: 'package',
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
    imageType: 'upload' | 'icon';
    uploadedImage?: string;
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
                description: 'User uploaded image',
                imageHint: 'uploaded',
                iconId: undefined,
            };
        } else if (updatedDetails.imageType === 'icon' && updatedDetails.iconId) {
            productImage = {
                imageUrl: '',
                description: `${updatedDetails.iconId} icon`,
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
