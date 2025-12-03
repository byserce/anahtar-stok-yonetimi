import BottomNavbar from '@/components/bottom-navbar';

export default function InventoryDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col bg-background">
      <main className="flex-1 overflow-y-auto">{children}</main>
      <BottomNavbar />
    </div>
  );
}
