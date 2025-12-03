// This is the root layout for the main app section (inventories, etc.)
// It no longer needs the BottomNavbar as that will be part of the inventory-specific layout.

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col bg-background">
      <main className="flex-1 overflow-y-auto">{children}</main>
      {/* BottomNavbar is removed from here */}
    </div>
  );
}
