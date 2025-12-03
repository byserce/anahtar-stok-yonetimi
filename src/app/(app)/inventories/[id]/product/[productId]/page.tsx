'use client';

import ProductDetailClient from '@/components/product-detail-client';
import { useParams } from 'next/navigation'


export default function ProductDetailPage() {
  const params = useParams();
  const inventoryId = params.id as string;
  const productId = params.productId as string;

  return <ProductDetailClient inventoryId={inventoryId} productId={productId} />;
}
