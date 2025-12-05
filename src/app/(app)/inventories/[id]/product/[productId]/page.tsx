'use client';

import ProductDetailClient from '@/components/product-detail-client';
import { useParams } from 'next/navigation';
import { SettingsProvider } from '@/context/settings-context';


export default function ProductDetailPage() {
  const params = useParams();
  const inventoryId = params.id as string;
  const productId = params.productId as string;

  return (
    <SettingsProvider>
      <ProductDetailClient inventoryId={inventoryId} productId={productId} />
    </SettingsProvider>
  );
}
