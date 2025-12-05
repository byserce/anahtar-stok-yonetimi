import { SettingsProvider } from '@/context/settings-context';
import { TranslationProvider } from '@/context/translation-context';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <TranslationProvider>
        <div className="flex h-dvh flex-col bg-background">
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </TranslationProvider>
    </SettingsProvider>
  );
}
