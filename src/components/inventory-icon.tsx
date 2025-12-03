import { getInventoryIcon } from '@/lib/inventory-icons';
import type { LucideProps } from 'lucide-react';

type InventoryIconProps = LucideProps & {
  iconId: string;
};

export function InventoryIcon({ iconId, ...props }: InventoryIconProps) {
  const Icon = getInventoryIcon(iconId);
  return <Icon {...props} />;
}
