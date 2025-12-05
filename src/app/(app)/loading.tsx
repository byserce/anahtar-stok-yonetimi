import { Package } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center bg-background">
      <div className="flex animate-pulse flex-col items-center gap-4">
        <Package className="h-16 w-16 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight text-muted-foreground">
          Stok Yönetimi
        </h1>
      </div>
    </div>
  );
}
