import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';


export type ProductImage = {
  // if image is a URL from library or upload
  imageUrl: string; 
  description: string;
  imageHint: string;
  // if image is an icon
  iconId?: string;
}

export const getImage = (id: string): ImagePlaceholder => {
  const image = PlaceHolderImages.find((img) => img.id === id);
  if (!image) {
    return {
      id: 'fallback',
      description: 'A fallback image',
      imageUrl: 'https://picsum.photos/seed/fallback/400/300',
      imageHint: 'tool',
    };
  }
  return image;
};

// Represents a single, user-defined location within an inventory
export type Location = {
  id: string; // e.g., 'loc_1'
  name: string; // e.g., 'Dükkan'
};

// Represents the stock of a specific product in a specific inventory
export type ProductStock = {
  productId: string;
  inventoryId: string;
  // Key is the location ID (e.g., 'loc_1'), value is the stock count
  stockByLocation: Record<string, number>;
};

// Represents a global product definition (without stock info)
export type Product = {
  id: string;
  name: string;
  code: string;
  image: ProductImage;
  purchasePrice: number;
  salePrice?: number;
};

// Represents a single inventory
export type Inventory = {
  id:string;
  name: string;
  iconId: string;
  locations: Location[];
  productIds: string[]; // List of product IDs in this inventory
  criticalThresholds: Record<string, number>; // productId -> threshold
};

// The new top-level data structure for localStorage
export type AppData = {
  inventories: Record<string, Inventory>;
  products: Record<string, Product>;
  productStocks: Record<string, ProductStock>; // key is `${inventoryId}_${productId}`
};
