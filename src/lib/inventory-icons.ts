import {
  Warehouse, Store, Car, Truck, Home, ShoppingBasket, Building, Factory,
  Ship, Plane, Box, Archive, Wrench, Hammer, HardHat, Package,
  ShoppingCart, Briefcase, Tractor, Bus, Bike, Train, Caravan, Sailboat,
  GanttChartSquare, ClipboardList, Folder, File, Drill, Screwdriver,
  Paintbrush, RollerCoaster, SprayCan, Key, Lock, Unlock, Lightbulb,
  Battery, Plug, Cable
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type InventoryIconInfo = {
  id: string;
  Icon: LucideIcon;
};

export const inventoryIcons: InventoryIconInfo[] = [
  { id: 'warehouse', Icon: Warehouse },
  { id: 'store', Icon: Store },
  { id: 'car', Icon: Car },
  { id: 'truck', Icon: Truck },
  { id: 'home', Icon: Home },
  { id: 'shopping-basket', Icon: ShoppingBasket },
  { id: 'building', Icon: Building },
  { id: 'factory', Icon: Factory },
  { id: 'ship', Icon: Ship },
  { id: 'plane', Icon: Plane },
  { id: 'box', Icon: Box },
  { id: 'archive', Icon: Archive },
  { id: 'wrench', Icon: Wrench },
  { id: 'hammer', Icon: Hammer },
  { id: 'hard-hat', Icon: HardHat },
  { id: 'package', Icon: Package },
  { id: 'shopping-cart', Icon: ShoppingCart },
  { id: 'briefcase', Icon: Briefcase },
  { id: 'tractor', Icon: Tractor },
  { id: 'bus', Icon: Bus },
  { id: 'bike', Icon: Bike },
  { id: 'train', Icon: Train },
  { id: 'caravan', Icon: Caravan },
  { id: 'sailboat', Icon: Sailboat },
  { id: 'gantt-chart-square', Icon: GanttChartSquare },
  { id: 'clipboard-list', Icon: ClipboardList },
  { id: 'folder', Icon: Folder },
  { id: 'file', Icon: File },
  { id: 'drill', Icon: Drill },
  { id: 'screwdriver', Icon: Screwdriver },
  { id: 'paintbrush', Icon: Paintbrush },
  { id: 'roller-coaster', Icon: RollerCoaster },
  { id: 'spray-can', Icon: SprayCan },
  { id: 'key', Icon: Key },
  { id: 'lock', Icon: Lock },
  { id: 'unlock', Icon: Unlock },
  { id: 'lightbulb', Icon: Lightbulb },
  { id: 'battery', Icon: Battery },
  { id: 'plug', Icon: Plug },
  { id: 'cable', Icon: Cable },
];

export const getInventoryIcon = (id: string): LucideIcon => {
  return inventoryIcons.find((icon) => icon.id === id)?.Icon || Package;
};
